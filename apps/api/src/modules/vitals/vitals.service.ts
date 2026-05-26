import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, VitalsRecord as SharedRecord } from "@his/shared";
import { VitalsRecord, VitalsRecordDocument } from "./vitals-record.schema";
import { User, UserDocument } from "../users/user.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { CreateVitalsRecordDto } from "./dto/create-vitals-record.dto";

@Injectable()
export class VitalsService {
  constructor(
    @InjectModel(VitalsRecord.name)
    private readonly model: Model<VitalsRecordDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
  ) {}

  private toShared(doc: VitalsRecordDocument): SharedRecord {
    return {
      id:                    doc._id.toString(),
      patientId:             doc.patientId.toString(),
      recordedById:          doc.recordedById.toString(),
      recordedByName:        doc.recordedByName,
      recordedAt:            doc.recordedAt.toISOString(),
      temperature:           doc.temperature,
      bloodPressureSystolic: doc.bloodPressureSystolic,
      bloodPressureDiastolic:doc.bloodPressureDiastolic,
      heartRate:             doc.heartRate,
      respiratoryRate:       doc.respiratoryRate,
      oxygenSaturation:      doc.oxygenSaturation,
      weight:                doc.weight,
      height:                doc.height,
      createdAt:             (doc as any).createdAt?.toISOString() ?? doc.recordedAt.toISOString(),
    };
  }

  async create(dto: CreateVitalsRecordDto, actor: AuthUser): Promise<SharedRecord> {
    const [patient, user] = await Promise.all([
      this.patientModel.findById(dto.patientId).lean(),
      this.userModel.findById(actor.id).lean(),
    ]);
    if (!patient) throw new NotFoundException("Өвчтөн олдсонгүй");

    const doc = await this.model.create({
      patientId:             new Types.ObjectId(dto.patientId),
      recordedById:          new Types.ObjectId(actor.id),
      recordedByName:        user?.fullName ?? actor.email,
      recordedAt:            new Date(),
      temperature:           dto.temperature,
      bloodPressureSystolic: dto.bloodPressureSystolic,
      bloodPressureDiastolic:dto.bloodPressureDiastolic,
      heartRate:             dto.heartRate,
      respiratoryRate:       dto.respiratoryRate,
      oxygenSaturation:      dto.oxygenSaturation,
      weight:                dto.weight,
      height:                dto.height,
    });

    return this.toShared(doc);
  }

  async listByPatient(patientId: string): Promise<SharedRecord[]> {
    const docs = await this.model
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ recordedAt: -1 })
      .limit(50)
      .lean();
    return docs.map((d) => this.toShared(d as VitalsRecordDocument));
  }

  async getLatest(patientId: string): Promise<SharedRecord | null> {
    const doc = await this.model
      .findOne({ patientId: new Types.ObjectId(patientId) })
      .sort({ recordedAt: -1 })
      .lean();
    if (!doc) return null;
    return this.toShared(doc as VitalsRecordDocument);
  }
}
