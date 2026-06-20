import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, TreatmentRecord } from "@his/shared";
import { Treatment, TreatmentDocument } from "./treatment.schema";
import { Patient, PatientDocument } from "./patient.schema";
import { CreateTreatmentDto } from "./dto/create-treatment.dto";
import { DrugsService } from "../drugs/drugs.service";
import { TreatmentTaskService } from "../treatment-tasks/treatment-task.service";
import { InvoicesService } from "../billing/invoices.service";
import { HospitalConfigService } from "../hospital-config/hospital-config.service";

@Injectable()
export class TreatmentService {
  constructor(
    @InjectModel(Treatment.name)
    private readonly model: Model<TreatmentDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    private readonly drugsService: DrugsService,
    private readonly taskService: TreatmentTaskService,
    private readonly invoicesService: InvoicesService,
    private readonly hospitalConfig: HospitalConfigService,
  ) {}

  private toShared(doc: TreatmentDocument): TreatmentRecord {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      drugs: doc.drugs.map((d) => ({
        drugId:         (d as any).drugId?.toString(),
        nameFormDosage: d.nameFormDosage,
        totalQuantity:  d.totalQuantity,
        route:          d.route,
        frequency:      d.frequency,
        perDose:        d.perDose,
        duration:       d.duration,
        notes:          d.notes,
      })),
      recordedById:   doc.recordedById.toString(),
      recordedByName: doc.recordedByName,
      invoiceId:      doc.invoiceId?.toString(),
      invoiceNumber:  doc.invoiceNumber,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async create(
    patientId: string,
    dto: CreateTreatmentDto,
    actor: AuthUser,
  ): Promise<TreatmentRecord> {
    const doc = await this.model.create({
      patientId:      new Types.ObjectId(patientId),
      drugs:          dto.drugs,
      recordedById:   new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });

    // FEFO-гоор нөөц хасах + нэхэмжлэлийн мөр бэлдэх (зөвхөн агуулахын эм)
    const invoiceItems: Array<{ name: string; quantity: number; unitPrice: number }> = [];
    for (const drug of dto.drugs) {
      if (drug.drugId && drug.totalQuantity && drug.totalQuantity > 0) {
        const res = await this.drugsService
          .deductFEFO(drug.drugId, drug.totalQuantity, {
            refType: "treatment",
            refId:   doc._id.toString(),
            reason:  "Эмчилгээ (жор)",
            actor:   { id: actor.id, name: actor.fullName ?? actor.email },
          })
          .catch(() => null);

        // Бодит FEFO цувралын зарах үнээр нэхэмжлэлийн мөр үүсгэх
        if (res && res.deducted > 0 && res.totalSale > 0) {
          invoiceItems.push({
            name:      drug.nameFormDosage,
            quantity:  res.deducted,
            unitPrice: Math.round(res.totalSale / res.deducted),
          });
        }
      }
    }

    // Үнэтэй эм байвал автомат нэхэмжлэл үүсгэх (НӨАТ-тай)
    if (invoiceItems.length > 0) {
      const cfg = await this.hospitalConfig.get().catch(() => null);
      const vatRate = cfg?.vatEnabled ? cfg.vatRate : 0;
      try {
        const invoice = await this.invoicesService.createFromTreatment({
          patientId,
          treatmentId: doc._id.toString(),
          items:       invoiceItems,
          vatRate,
          actor,
        });
        doc.invoiceId = new Types.ObjectId(invoice.id);
        doc.invoiceNumber = invoice.invoiceNumber;
        await doc.save();
      } catch {
        // нэхэмжлэл амжилтгүй ч эмчилгээний бүртгэл хэвээр үлдэнэ
      }
    }

    // Auto-create treatment tasks only when "Эмнэлэг дээр хийлгэх" is toggled on
    if (dto.addToTasks) {
      const patient = await this.patientModel.findById(patientId).lean().exec();
      if (patient) {
        await this.taskService.createFromRecord({
          patientId,
          patientName:    `${patient.lastName} ${patient.firstName}`,
          patientCode:    patient.patientCode,
          registerNumber: patient.registerNumber,
          drugs: dto.drugs
            .filter((d) => d.nameFormDosage.trim())
            .map((d) => ({
              drugName:  d.nameFormDosage,
              route:     d.route,
              frequency: d.frequency,
              perDose:   d.perDose,
              duration:  d.duration,
              notes:     d.notes,
            })),
          sourceRecordId: doc._id.toString(),
          actor,
        }).catch(() => {});
      }
    }

    return this.toShared(doc);
  }

  async listByPatient(patientId: string): Promise<TreatmentRecord[]> {
    const docs = await this.model
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toShared(d));
  }

  async deleteRecord(id: string, actor: AuthUser): Promise<void> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException("Эмчилгээний бүртгэл олдсонгүй");
    if (actor.role !== "admin" && doc.recordedById.toString() !== actor.id) {
      throw new ForbiddenException("Зөвхөн бүртгэсэн эмч өөрийн эмчилгээг устгах боломжтой");
    }
    await doc.deleteOne();
  }
}
