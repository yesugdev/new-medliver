import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, TreatmentRecord } from "@his/shared";
import { Treatment, TreatmentDocument } from "./treatment.schema";
import { CreateTreatmentDto } from "./dto/create-treatment.dto";

@Injectable()
export class TreatmentService {
  constructor(
    @InjectModel(Treatment.name)
    private readonly model: Model<TreatmentDocument>,
  ) {}

  private toShared(doc: TreatmentDocument): TreatmentRecord {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      drugs: doc.drugs.map((d) => ({
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
      patientId:     new Types.ObjectId(patientId),
      drugs:         dto.drugs,
      recordedById:  new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.toShared(doc);
  }

  async listByPatient(patientId: string): Promise<TreatmentRecord[]> {
    const docs = await this.model
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toShared(d));
  }

  async deleteRecord(id: string): Promise<void> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException("Эмчилгээний бүртгэл олдсонгүй");
    await doc.deleteOne();
  }
}
