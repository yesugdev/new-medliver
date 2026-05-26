import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, FilterQuery } from "mongoose";
import type { AuthUser, Invoice as SharedInvoice } from "@his/shared";
import { Invoice, InvoiceDocument } from "./invoice.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { CreateInvoiceDto, RecordPaymentDto } from "./dto/invoice.dto";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly model: Model<InvoiceDocument>,
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    private readonly audit: AuditService,
  ) {}

  private async toShared(doc: InvoiceDocument): Promise<SharedInvoice> {
    const patient = await this.patientModel.findById(doc.patientId).lean();
    return {
      id: doc._id.toString(),
      invoiceNumber: doc.invoiceNumber,
      patientId: doc.patientId.toString(),
      patientName: patient ? `${patient.lastName} ${patient.firstName}` : "—",
      patientCode: patient?.patientCode ?? "—",
      visitId: doc.visitId?.toString(),
      items: doc.items.map((i) => ({
        serviceId: i.serviceId?.toString(),
        code: i.code,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      subtotal: doc.subtotal,
      discount: doc.discount,
      total: doc.total,
      paid: doc.paid,
      balance: doc.balance,
      status: doc.status,
      payments: doc.payments.map((p) => ({
        amount: p.amount,
        method: p.method,
        paidAt: p.paidAt.toISOString(),
        receivedBy: p.receivedBy,
        note: p.note,
      })),
      issuedAt: doc.issuedAt.toISOString(),
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.model.countDocuments({
      invoiceNumber: { $regex: `^INV${year}-` },
    });
    return `INV${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async create(dto: CreateInvoiceDto, actor: AuthUser): Promise<SharedInvoice> {
    const patient = await this.patientModel.findById(dto.patientId).lean();
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");
    if (!dto.items.length) throw new BadRequestException("Үйлчилгээ оруулна уу");

    const items = dto.items.map((i) => ({
      serviceId: i.serviceId ? new Types.ObjectId(i.serviceId) : undefined,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice),
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = dto.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    const invoiceNumber = await this.generateInvoiceNumber();
    const created = await this.model.create({
      invoiceNumber,
      patientId: new Types.ObjectId(dto.patientId),
      visitId: dto.visitId ? new Types.ObjectId(dto.visitId) : undefined,
      items,
      subtotal,
      discount,
      total,
      paid: 0,
      balance: total,
      status: "issued",
      payments: [],
      issuedAt: new Date(),
      createdBy: actor.id,
    });

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.create",
      resource: "invoice",
      resourceId: created._id.toString(),
      meta: { invoiceNumber, total },
    });

    return this.toShared(created);
  }

  async list(params: { patientId?: string; status?: string; page?: number; pageSize?: number }) {
    const filter: FilterQuery<InvoiceDocument> = {};
    if (params.patientId) filter.patientId = new Types.ObjectId(params.patientId);
    if (params.status) filter.status = params.status as any;

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ issuedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    const items = await Promise.all(docs.map((d) => this.toShared(d)));
    return { items, total, page, pageSize };
  }

  async getById(id: string): Promise<SharedInvoice> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    return this.toShared(doc);
  }

  async recordPayment(
    id: string,
    dto: RecordPaymentDto,
    actor: AuthUser,
  ): Promise<SharedInvoice> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    if (doc.status === "cancelled") {
      throw new BadRequestException("Цуцалсан нэхэмжлэлд төлбөр оруулах боломжгүй");
    }
    if (dto.amount > doc.balance) {
      throw new BadRequestException("Үлдэгдлээс илүү төлбөр оруулах боломжгүй");
    }

    doc.payments.push({
      amount: dto.amount,
      method: dto.method,
      paidAt: new Date(),
      receivedBy: actor.fullName,
      note: dto.note,
    } as any);
    doc.paid += dto.amount;
    doc.balance = Math.max(0, doc.total - doc.paid);
    doc.status = doc.balance === 0 ? "paid" : "partial";
    await doc.save();

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.payment",
      resource: "invoice",
      resourceId: doc._id.toString(),
      meta: { amount: dto.amount, method: dto.method },
    });

    return this.toShared(doc);
  }

  async cancel(id: string, actor: AuthUser): Promise<SharedInvoice> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    doc.status = "cancelled";
    await doc.save();
    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.cancel",
      resource: "invoice",
      resourceId: doc._id.toString(),
    });
    return this.toShared(doc);
  }

  async todayRevenue(): Promise<{ total: number; paid: number; count: number }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const docs = await this.model
      .find({ issuedAt: { $gte: start, $lte: end }, status: { $ne: "cancelled" } })
      .lean();
    return {
      total: docs.reduce((s, d) => s + d.total, 0),
      paid: docs.reduce((s, d) => s + d.paid, 0),
      count: docs.length,
    };
  }
}
