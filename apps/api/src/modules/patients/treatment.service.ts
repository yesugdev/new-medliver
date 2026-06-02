import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, TreatmentRecord } from "@his/shared";
import { Treatment, TreatmentDocument } from "./treatment.schema";
import { Patient, PatientDocument } from "./patient.schema";
import { CreateTreatmentDto } from "./dto/create-treatment.dto";
import { DrugsService } from "../drugs/drugs.service";
import { TreatmentTaskService } from "../treatment-tasks/treatment-task.service";

@Injectable()
export class TreatmentService {
  constructor(
    @InjectModel(Treatment.name)
    private readonly model: Model<TreatmentDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    private readonly drugsService: DrugsService,
    private readonly taskService: TreatmentTaskService,
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

    // Deduct stock for inventory drugs
    for (const drug of dto.drugs) {
      if (drug.drugId && drug.totalQuantity && drug.totalQuantity > 0) {
        await this.drugsService.deductStock(drug.drugId, drug.totalQuantity).catch(() => {});
      }
    }

    // Auto-create treatment tasks
    const patient = await this.patientModel.findById(patientId).lean().exec();
    if (patient) {
      await this.taskService.createFromRecord({
        patientId,
        patientName:  `${patient.lastName} ${patient.firstName}`,
        patientCode:  patient.patientCode,
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
