import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, PatientDiagnosis as IPatientDiagnosis, ClinicalScore as IClinicalScore } from "@his/shared";
import { PatientDiagnosis, PatientDiagnosisDocument } from "./diagnosis.schema";
import { ClinicalScore, ClinicalScoreDocument } from "./clinical-score.schema";
import { CreatePatientDiagnosisDto } from "./dto/create-diagnosis.dto";
import { CreateClinicalScoreDto } from "./dto/create-clinical-score.dto";

@Injectable()
export class DiagnosesService {
  constructor(
    @InjectModel(PatientDiagnosis.name)
    private readonly diagModel: Model<PatientDiagnosisDocument>,
    @InjectModel(ClinicalScore.name)
    private readonly scoreModel: Model<ClinicalScoreDocument>,
  ) {}

  /* ── Diagnoses ───────────────────────────────────────────────────── */

  async listDiagnoses(patientId: string): Promise<IPatientDiagnosis[]> {
    const docs = await this.diagModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(this.diagToShared);
  }

  async createDiagnosis(
    patientId: string,
    dto: CreatePatientDiagnosisDto,
    actor: AuthUser,
  ): Promise<IPatientDiagnosis> {
    const doc = await this.diagModel.create({
      patientId: new Types.ObjectId(patientId),
      date: dto.date,
      primary: dto.primary,
      comorbidities: dto.comorbidities ?? [],
      recordedById: new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.diagToShared(doc as any);
  }

  async deleteDiagnosis(id: string): Promise<void> {
    const doc = await this.diagModel.findById(id);
    if (!doc) throw new NotFoundException("Оноош олдсонгүй");
    await doc.deleteOne();
  }

  /* ── Clinical scores ─────────────────────────────────────────────── */

  async listScores(patientId: string): Promise<IClinicalScore[]> {
    const docs = await this.scoreModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(this.scoreToShared);
  }

  async createScore(
    patientId: string,
    dto: CreateClinicalScoreDto,
    actor: AuthUser,
  ): Promise<IClinicalScore> {
    const doc = await this.scoreModel.create({
      patientId: new Types.ObjectId(patientId),
      date: dto.date,
      type: dto.type,
      inputs: dto.inputs,
      score: dto.score,
      grade: dto.grade,
      interpretation: dto.interpretation,
      recordedById: new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.scoreToShared(doc as any);
  }

  async deleteScore(id: string): Promise<void> {
    const doc = await this.scoreModel.findById(id);
    if (!doc) throw new NotFoundException("Оноо олдсонгүй");
    await doc.deleteOne();
  }

  /* ── Mappers ─────────────────────────────────────────────────────── */

  private diagToShared(doc: any): IPatientDiagnosis {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      date: doc.date,
      primary: doc.primary,
      comorbidities: doc.comorbidities ?? [],
      recordedById: doc.recordedById.toString(),
      recordedByName: doc.recordedByName,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private scoreToShared(doc: any): IClinicalScore {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      date: doc.date,
      type: doc.type,
      inputs: doc.inputs ?? {},
      score: doc.score,
      grade: doc.grade,
      interpretation: doc.interpretation,
      recordedById: doc.recordedById.toString(),
      recordedByName: doc.recordedByName,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
