import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { AuthUser, Visit as SharedVisit } from "@his/shared";
import { Visit, VisitDocument } from "./visit.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { User, UserDocument } from "../users/user.schema";
import { Appointment, AppointmentDocument } from "../appointments/appointment.schema";
import { CreateVisitDto } from "./dto/create-visit.dto";
import { UpdateVisitDto } from "./dto/update-visit.dto";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class EmrService {
  constructor(
    @InjectModel(Visit.name) private readonly model: Model<VisitDocument>,
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly audit: AuditService,
  ) {}

  private async toShared(doc: VisitDocument): Promise<SharedVisit> {
    const [patient, doctor] = await Promise.all([
      this.patientModel.findById(doc.patientId).lean(),
      this.userModel.findById(doc.doctorId).lean(),
    ]);
    return {
      id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      patientName: patient ? `${patient.lastName} ${patient.firstName}` : "—",
      patientCode: patient?.patientCode ?? "—",
      doctorId: doc.doctorId.toString(),
      doctorName: doctor?.fullName ?? "—",
      appointmentId: doc.appointmentId?.toString(),
      visitDate: doc.visitDate.toISOString(),
      status: doc.status,
      chiefComplaint: doc.chiefComplaint,
      symptoms: doc.symptoms,
      diagnosis: doc.diagnosis,
      treatment: doc.treatment,
      notes: doc.notes,
      vitals: doc.vitals,
      prescriptions: doc.prescriptions,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async create(dto: CreateVisitDto, actor: AuthUser): Promise<SharedVisit> {
    const patient = await this.patientModel.findById(dto.patientId).lean();
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");

    let doctorId = new Types.ObjectId(actor.id);
    if (dto.appointmentId) {
      const appt = await this.appointmentModel.findById(dto.appointmentId).exec();
      if (appt) {
        doctorId = appt.doctorId;
        appt.status = "in_progress";
        appt.startedAt = new Date();
        await appt.save();
      }
    }

    const created = await this.model.create({
      patientId: new Types.ObjectId(dto.patientId),
      doctorId,
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      visitDate: new Date(),
      status: "in_progress",
      chiefComplaint: dto.chiefComplaint,
    });

    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "visit.create",
      resource: "visit",
      resourceId: created._id.toString(),
    });

    return this.toShared(created);
  }

  async update(id: string, dto: UpdateVisitDto, actor: AuthUser): Promise<SharedVisit> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Үзлэг олдсонгүй");

    // Only the doctor who created the visit (or admin) may edit
    if (actor.role !== "admin" && doc.doctorId.toString() !== actor.id) {
      throw new ForbiddenException("Зөвхөн үзлэг хийсэн эмч засах боломжтой");
    }

    if (dto.chiefComplaint !== undefined) doc.chiefComplaint = dto.chiefComplaint;
    if (dto.symptoms !== undefined) doc.symptoms = dto.symptoms;
    if (dto.diagnosis !== undefined) doc.diagnosis = dto.diagnosis;
    if (dto.treatment !== undefined) doc.treatment = dto.treatment;
    if (dto.notes !== undefined) doc.notes = dto.notes;
    if (dto.vitals !== undefined) doc.vitals = dto.vitals as any;
    if (dto.prescriptions !== undefined) doc.prescriptions = dto.prescriptions as any;

    if (dto.status === "completed" && doc.status !== "completed") {
      doc.status = "completed";
      if (doc.appointmentId) {
        await this.appointmentModel.updateOne(
          { _id: doc.appointmentId },
          { $set: { status: "completed", completedAt: new Date() } },
        );
      }
    }

    await doc.save();
    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "visit.update",
      resource: "visit",
      resourceId: doc._id.toString(),
    });

    return this.toShared(doc);
  }

  async getById(id: string): Promise<SharedVisit> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Үзлэг олдсонгүй");
    return this.toShared(doc);
  }

  async listByPatient(patientId: string): Promise<SharedVisit[]> {
    const docs = await this.model
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ visitDate: -1 })
      .exec();
    return Promise.all(docs.map((d) => this.toShared(d)));
  }

  async countToday(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.model.countDocuments({ visitDate: { $gte: start, $lte: end } });
  }
}
