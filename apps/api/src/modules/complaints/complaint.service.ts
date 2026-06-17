import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, ComplaintOption as IComplaintOption, PatientComplaint } from "@his/shared";
import { ComplaintOption, ComplaintOptionDocument } from "./complaint-option.schema";
import { Complaint, ComplaintDocument } from "./complaint.schema";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { CreateComplaintOptionDto } from "./dto/create-complaint-option.dto";

@Injectable()
export class ComplaintService {
  constructor(
    @InjectModel(ComplaintOption.name)
    private readonly optionModel: Model<ComplaintOptionDocument>,
    @InjectModel(Complaint.name)
    private readonly complaintModel: Model<ComplaintDocument>,
  ) {}

  /* ── Options (admin) ─────────────────────────────────────────────── */

  async listOptions(): Promise<IComplaintOption[]> {
    const docs = await this.optionModel.find().sort({ category: 1, order: 1, createdAt: 1 }).lean();
    return docs.map((d) => ({
      id: (d as any)._id.toString(),
      category: d.category,
      name: d.name,
      isActive: d.isActive,
      order: d.order,
    }));
  }

  async createOption(dto: CreateComplaintOptionDto): Promise<IComplaintOption> {
    const count = await this.optionModel.countDocuments({ category: dto.category });
    const doc = await this.optionModel.create({
      category: dto.category,
      name: dto.name,
      isActive: true,
      order: count,
    });
    return {
      id: doc._id.toString(),
      category: doc.category,
      name: doc.name,
      isActive: doc.isActive,
      order: doc.order,
    };
  }

  async deleteOption(id: string): Promise<void> {
    const doc = await this.optionModel.findById(id);
    if (!doc) throw new NotFoundException("Сонголт олдсонгүй");
    await doc.deleteOne();
  }

  /* ── Patient complaints ──────────────────────────────────────────── */

  async listByPatient(patientId: string): Promise<PatientComplaint[]> {
    const docs = await this.complaintModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(this.toShared);
  }

  async create(patientId: string, dto: CreateComplaintDto, actor: AuthUser): Promise<PatientComplaint> {
    const doc = await this.complaintModel.create({
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(actor.id),
      doctorName: actor.fullName ?? actor.email,
      date: dto.date,
      lines: dto.lines.map((l) => ({
        complaintName: l.complaintName,
        locationName: l.locationName,
        notes: l.notes ?? "",
      })),
    });
    return this.toShared(doc as any);
  }

  async deleteComplaint(id: string): Promise<void> {
    const doc = await this.complaintModel.findById(id);
    if (!doc) throw new NotFoundException("Зовуурийн бүртгэл олдсонгүй");
    await doc.deleteOne();
  }

  private toShared(doc: any): PatientComplaint {
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      doctorId: doc.doctorId.toString(),
      doctorName: doc.doctorName,
      date: doc.date,
      lines: doc.lines ?? [],
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
