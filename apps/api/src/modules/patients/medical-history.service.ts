import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, MedicalHistoryRecord } from "@his/shared";
import { MedicalHistory, MedicalHistoryDocument } from "./medical-history.schema";
import { CreateMedicalHistoryDto } from "./dto/create-medical-history.dto";

@Injectable()
export class MedicalHistoryService {
  constructor(
    @InjectModel(MedicalHistory.name)
    private readonly model: Model<MedicalHistoryDocument>,
  ) {}

  private toShared(doc: MedicalHistoryDocument): MedicalHistoryRecord {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      symptoms: doc.symptoms,
      diagnoses: doc.diagnoses,
      diagnosedAt: doc.diagnosedAt,
      diagnosedWhere: doc.diagnosedWhere,
      previousClinic: doc.previousClinic,
      treatmentTypes: doc.treatmentTypes,
      treatmentResult: doc.treatmentResult,
      diseaseDuration: doc.diseaseDuration,
      diseaseStartCause: doc.diseaseStartCause,
      testsPerformed: doc.testsPerformed,
      progressBeforeAdmission: doc.progressBeforeAdmission,
      initialSymptoms: doc.initialSymptoms,
      annualFlareCount: doc.annualFlareCount,
      flaresCause: doc.flaresCause,
      flaresPrevention: doc.flaresPrevention,
      additionalInfo: doc.additionalInfo,
      recordedById: doc.recordedById.toString(),
      recordedByName: doc.recordedByName,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async create(
    patientId: string,
    dto: CreateMedicalHistoryDto,
    actor: AuthUser,
  ): Promise<MedicalHistoryRecord> {
    const doc = await this.model.create({
      patientId: new Types.ObjectId(patientId),
      symptoms: dto.symptoms ?? [],
      diagnoses: dto.diagnoses ?? [],
      diagnosedAt: dto.diagnosedAt,
      diagnosedWhere: dto.diagnosedWhere,
      previousClinic: dto.previousClinic,
      treatmentTypes: dto.treatmentTypes ?? [],
      treatmentResult: dto.treatmentResult,
      diseaseDuration: dto.diseaseDuration,
      diseaseStartCause: dto.diseaseStartCause,
      testsPerformed: dto.testsPerformed,
      progressBeforeAdmission: dto.progressBeforeAdmission,
      initialSymptoms: dto.initialSymptoms,
      annualFlareCount: dto.annualFlareCount,
      flaresCause: dto.flaresCause,
      flaresPrevention: dto.flaresPrevention,
      additionalInfo: dto.additionalInfo,
      recordedById: new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.toShared(doc);
  }

  async listByPatient(patientId: string): Promise<MedicalHistoryRecord[]> {
    const docs = await this.model
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toShared(d));
  }

  async deleteRecord(id: string): Promise<void> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException("Өвчний түүх олдсонгүй");
    await doc.deleteOne();
  }
}
