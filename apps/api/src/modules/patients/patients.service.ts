import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import type { AuthUser, Patient as SharedPatient } from "@his/shared";
import { Patient, PatientDocument } from "./patient.schema";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { ListPatientsDto } from "./dto/list-patients.dto";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly model: Model<PatientDocument>,
    private readonly audit: AuditService,
  ) {}

  private toShared(doc: PatientDocument): SharedPatient {
    return {
      id: doc._id.toString(),
      patientCode: doc.patientCode,
      registerNumber: doc.registerNumber,
      lastName: doc.lastName,
      firstName: doc.firstName,
      gender: doc.gender,
      birthDate: doc.birthDate.toISOString(),
      phone: doc.phone,
      email: doc.email,
      address: doc.address,
      bloodType: doc.bloodType,
      allergies: doc.allergies ?? [],
      chronicConditions: doc.chronicConditions ?? [],
      emergencyContact: doc.emergencyContact
        ? {
            name: doc.emergencyContact.name,
            relation: doc.emergencyContact.relation,
            phone: doc.emergencyContact.phone,
          }
        : undefined,
      notes: doc.notes,
      attendingDoctorId: doc.attendingDoctorId,
      attendingDoctorName: doc.attendingDoctorName,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private async generatePatientCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.model.countDocuments({
      patientCode: { $regex: `^P${year}-` },
    });
    return `P${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async create(dto: CreatePatientDto, actor: AuthUser): Promise<SharedPatient> {
    const existing = await this.model
      .findOne({ registerNumber: dto.registerNumber.toUpperCase() })
      .lean();
    if (existing) {
      throw new ConflictException("Энэ регистрийн дугаартай өвчтөн бүртгэлтэй байна");
    }

    const patientCode = await this.generatePatientCode();
    const created = await this.model.create({
      ...dto,
      registerNumber: dto.registerNumber.toUpperCase(),
      birthDate: new Date(dto.birthDate),
      patientCode,
      createdBy: actor.id,
    });

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "patient.create",
      resource: "patient",
      resourceId: created._id.toString(),
      meta: { patientCode },
    });

    return this.toShared(created);
  }

  async list(query: ListPatientsDto): Promise<{
    items: SharedPatient[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const filter: FilterQuery<PatientDocument> = {};

    if (query.search?.trim()) {
      const safe = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { lastName: { $regex: safe, $options: "i" } },
        { firstName: { $regex: safe, $options: "i" } },
        { phone: { $regex: safe, $options: "i" } },
        { registerNumber: { $regex: safe, $options: "i" } },
        { patientCode: { $regex: safe, $options: "i" } },
      ];
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    if (query.attendingDoctorId) {
      filter.attendingDoctorId = query.attendingDoctorId;
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      items: items.map((d) => this.toShared(d)),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<SharedPatient> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Өвчтөн олдсонгүй");
    return this.toShared(doc);
  }

  async update(id: string, dto: UpdatePatientDto, actor: AuthUser): Promise<SharedPatient> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Өвчтөн олдсонгүй");

    if (dto.registerNumber && dto.registerNumber.toUpperCase() !== doc.registerNumber) {
      const dup = await this.model
        .findOne({
          registerNumber: dto.registerNumber.toUpperCase(),
          _id: { $ne: doc._id },
        })
        .lean();
      if (dup) {
        throw new ConflictException("Энэ регистрийн дугаартай өвчтөн бүртгэлтэй байна");
      }
    }

    Object.assign(doc, {
      ...dto,
      registerNumber: dto.registerNumber?.toUpperCase() ?? doc.registerNumber,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : doc.birthDate,
    });
    await doc.save();

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "patient.update",
      resource: "patient",
      resourceId: doc._id.toString(),
    });

    return this.toShared(doc);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Өвчтөн олдсонгүй");
    (doc as any).deletedAt = new Date();
    await doc.save();

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "patient.delete",
      resource: "patient",
      resourceId: doc._id.toString(),
    });
  }
}
