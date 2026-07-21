import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, FilterQuery } from "mongoose";
import type { AuthUser, Invoice as SharedInvoice, ServiceCategory } from "@his/shared";
import { Invoice, InvoiceDocument } from "./invoice.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { CreateInvoiceDto, RecordPaymentDto } from "./dto/invoice.dto";
import { AuditService } from "../audit/audit.service";
import { DrugsService } from "../drugs/drugs.service";

export interface TreatmentInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly model: Model<InvoiceDocument>,
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    private readonly audit: AuditService,
    private readonly drugsService: DrugsService,
  ) {}

  /** subtotal − discount дээр НӨАТ тооцоолно */
  private computeTotals(subtotal: number, discount: number, vatRate: number) {
    const taxable = Math.max(0, subtotal - discount);
    const vat = vatRate > 0 ? Math.round(taxable * (vatRate / 100)) : 0;
    const total = taxable + vat;
    return { vat, total };
  }

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
        category: i.category as ServiceCategory | undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      subtotal: doc.subtotal,
      discount: doc.discount,
      vat: doc.vat ?? 0,
      vatRate: doc.vatRate ?? 0,
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

  /**
   * Хамгийн сүүлийн дугаараас +1 хийж тооцоолно (count-ээр биш) — эс тэгвэл
   * нэхэмжлэл устгагдсаны дараа count буурч, аль хэдийн ашиглагдсан дугаарыг
   * дахин олгож E11000 duplicate key алдаа өгдөг байсан.
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV${year}-`;
    const last = await this.model
      .findOne({ invoiceNumber: { $regex: `^${prefix}` } })
      .sort({ invoiceNumber: -1 })
      .lean();
    const seq = last
      ? parseInt(last.invoiceNumber.replace(prefix, ""), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  private isDuplicateInvoiceNumber(err: unknown): boolean {
    return !!err && typeof err === "object" && (err as any).code === 11000
      && "keyPattern" in (err as any) && "invoiceNumber" in (err as any).keyPattern;
  }

  /** Давхар дугаарын race condition-оос хамгаалж, шаардлагатай бол дугаарыг дахин үүсгэж оролдоно */
  private async createWithUniqueNumber(
    buildFields: (invoiceNumber: string) => Record<string, any>,
    attempts = 3,
  ): Promise<InvoiceDocument> {
    for (let i = 0; i < attempts; i++) {
      const invoiceNumber = await this.generateInvoiceNumber();
      try {
        return await this.model.create(buildFields(invoiceNumber));
      } catch (err) {
        if (!this.isDuplicateInvoiceNumber(err) || i === attempts - 1) throw err;
      }
    }
    throw new BadRequestException("Нэхэмжлэлийн дугаар үүсгэхэд алдаа гарлаа");
  }

  async create(dto: CreateInvoiceDto, actor: AuthUser): Promise<SharedInvoice> {
    const patient = await this.patientModel.findById(dto.patientId).lean();
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");
    if (!dto.items.length) throw new BadRequestException("Үйлчилгээ оруулна уу");

    const items = dto.items.map((i) => ({
      serviceId: i.serviceId ? new Types.ObjectId(i.serviceId) : undefined,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice),
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = dto.discount ?? 0;
    const vatRate = dto.vatRate ?? 0;
    const { vat, total } = this.computeTotals(subtotal, discount, vatRate);

    const created = await this.createWithUniqueNumber((invoiceNumber) => ({
      invoiceNumber,
      patientId: new Types.ObjectId(dto.patientId),
      visitId: dto.visitId ? new Types.ObjectId(dto.visitId) : undefined,
      items,
      subtotal,
      discount,
      vat,
      vatRate,
      total,
      paid: 0,
      balance: total,
      status: "issued",
      payments: [],
      issuedAt: new Date(),
      createdBy: actor.id,
    }));

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.create",
      resource: "invoice",
      resourceId: created._id.toString(),
      meta: { invoiceNumber: created.invoiceNumber, total },
    });

    return this.toShared(created);
  }

  /** Эмчилгээ (жор)-оос автомат нэхэмжлэл үүсгэх — эмийн line items + НӨАТ */
  async createFromTreatment(params: {
    patientId: string;
    visitId?: string;
    treatmentId: string;
    items: TreatmentInvoiceItem[];
    vatRate: number;
    actor: AuthUser;
  }): Promise<SharedInvoice> {
    const { patientId, visitId, treatmentId, vatRate, actor } = params;
    const items = params.items.map((i) => ({
      name: i.name,
      category: "medication" as ServiceCategory,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice),
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = 0;
    const { vat, total } = this.computeTotals(subtotal, discount, vatRate);

    const created = await this.createWithUniqueNumber((invoiceNumber) => ({
      invoiceNumber,
      patientId: new Types.ObjectId(patientId),
      visitId: visitId ? new Types.ObjectId(visitId) : undefined,
      sourceTreatmentId: new Types.ObjectId(treatmentId),
      items,
      subtotal,
      discount,
      vat,
      vatRate,
      total,
      paid: 0,
      balance: total,
      status: "issued",
      payments: [],
      issuedAt: new Date(),
      createdBy: actor.id,
    }));

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.create_from_treatment",
      resource: "invoice",
      resourceId: created._id.toString(),
      meta: { invoiceNumber: created.invoiceNumber, total, treatmentId },
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

  /** Төлөөгүй нэхэмжлэлд НӨАТ тохируулах (дахин тооцоолно) */
  async setVat(id: string, vatRate: number, actor: AuthUser): Promise<SharedInvoice> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    if (doc.status === "cancelled") throw new BadRequestException("Цуцалсан нэхэмжлэл");
    if (doc.paid > 0) throw new BadRequestException("Төлбөр төлсөн нэхэмжлэлийн НӨАТ өөрчлөх боломжгүй");

    const rate = Math.max(0, Math.min(vatRate, 100));
    const { vat, total } = this.computeTotals(doc.subtotal, doc.discount, rate);
    doc.vatRate = rate;
    doc.vat = vat;
    doc.total = total;
    doc.balance = total - doc.paid;
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "invoice.set_vat", resource: "invoice", resourceId: id,
      meta: { vatRate: rate, vat },
    });
    return this.toShared(doc);
  }

  async cancel(id: string, actor: AuthUser): Promise<SharedInvoice> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    doc.status = "cancelled";
    await doc.save();

    // Эмчилгээнээс үүссэн нэхэмжлэл бол хасагдсан эмийн нөөцийг буцаана
    if (doc.sourceTreatmentId) {
      await this.drugsService
        .reverseFEFO(doc.sourceTreatmentId.toString(), { id: actor.id, name: actor.fullName })
        .catch(() => {});
    }

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.cancel",
      resource: "invoice",
      resourceId: doc._id.toString(),
    });
    return this.toShared(doc);
  }

  /** Нэхэмжлэлийг бүрэн устгах. Эмчилгээнээс үүссэн бол нөөцийг буцаана. */
  async delete(id: string, actor: AuthUser): Promise<void> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Нэхэмжлэл олдсонгүй");

    if (doc.sourceTreatmentId) {
      await this.drugsService
        .reverseFEFO(doc.sourceTreatmentId.toString(), { id: actor.id, name: actor.fullName })
        .catch(() => {});
    }

    await doc.deleteOne();

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "invoice.delete",
      resource: "invoice",
      resourceId: id,
      meta: { invoiceNumber: doc.invoiceNumber },
    });
  }

  /** Нийт орлого — цуцлаагүй нэхэмжлэлийн төлсөн дүн */
  async totalRevenue(): Promise<number> {
    const agg = await this.model.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$paid" } } },
    ]);
    return agg[0]?.total ?? 0;
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
