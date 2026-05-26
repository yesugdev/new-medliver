import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, FilterQuery } from "mongoose";
import type { AuthUser, Appointment as SharedAppt } from "@his/shared";
import { Appointment, AppointmentDocument } from "./appointment.schema";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { User, UserDocument } from "../users/user.schema";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly model: Model<AppointmentDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly audit: AuditService,
  ) {}

  private async toShared(doc: AppointmentDocument): Promise<SharedAppt> {
    const [patient, doctor] = await Promise.all([
      this.patientModel.findById(doc.patientId).lean(),
      this.userModel.findById(doc.doctorId).lean(),
    ]);
    return {
      id:              doc._id.toString(),
      patientId:       doc.patientId.toString(),
      patientName:     patient ? `${patient.lastName} ${patient.firstName}` : "—",
      patientCode:     patient?.patientCode ?? "—",
      doctorId:        doc.doctorId.toString(),
      doctorName:      doctor?.fullName ?? "—",
      scheduledAt:     doc.scheduledAt.toISOString(),
      durationMinutes: doc.durationMinutes,
      type:            doc.type,
      status:          doc.status,
      queueNumber:     doc.queueNumber,
      reason:          doc.reason,
      notes:           doc.notes,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private async hydrateMany(docs: AppointmentDocument[]): Promise<SharedAppt[]> {
    if (docs.length === 0) return [];
    const patientIds = [...new Set(docs.map((d) => d.patientId.toString()))];
    const doctorIds  = [...new Set(docs.map((d) => d.doctorId.toString()))];
    const [patients, doctors] = await Promise.all([
      this.patientModel.find({ _id: { $in: patientIds } }).lean(),
      this.userModel.find({ _id: { $in: doctorIds } }).lean(),
    ]);
    const pMap = new Map(patients.map((p) => [p._id.toString(), p]));
    const dMap = new Map(doctors.map((d) => [d._id.toString(), d]));

    return docs.map((doc) => {
      const p = pMap.get(doc.patientId.toString());
      const d = dMap.get(doc.doctorId.toString());
      return {
        id:              doc._id.toString(),
        patientId:       doc.patientId.toString(),
        patientName:     p ? `${p.lastName} ${p.firstName}` : "—",
        patientCode:     p?.patientCode ?? "—",
        doctorId:        doc.doctorId.toString(),
        doctorName:      d?.fullName ?? "—",
        scheduledAt:     doc.scheduledAt.toISOString(),
        durationMinutes: doc.durationMinutes,
        type:            doc.type,
        status:          doc.status,
        queueNumber:     doc.queueNumber,
        reason:          doc.reason,
        notes:           doc.notes,
        createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
      };
    });
  }

  private dayBounds(dateStr: string): { start: Date; end: Date } {
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  async create(dto: CreateAppointmentDto, actor: AuthUser) {
    const patient = await this.patientModel.findById(dto.patientId).lean();
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");
    const doctor = await this.userModel.findById(dto.doctorId).lean();
    if (!doctor || doctor.role !== "doctor") throw new BadRequestException("Эмч буруу");

    const created = await this.model.create({
      patientId:       new Types.ObjectId(dto.patientId),
      doctorId:        new Types.ObjectId(dto.doctorId),
      scheduledAt:     new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes ?? 20,
      type:            dto.type,
      status:          "scheduled",
      reason:          dto.reason,
      notes:           dto.notes,
      createdBy:       actor.id,
    });

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "appointment.create", resource: "appointment",
      resourceId: created._id.toString(),
    });
    return this.toShared(created);
  }

  async list(query: ListAppointmentsDto) {
    const filter: FilterQuery<AppointmentDocument> = {};
    if (query.date) {
      const { start, end } = this.dayBounds(query.date);
      filter.scheduledAt = { $gte: start, $lte: end };
    } else if (query.from || query.to) {
      filter.scheduledAt = {};
      if (query.from) (filter.scheduledAt as any).$gte = new Date(query.from);
      if (query.to)   (filter.scheduledAt as any).$lte = new Date(query.to);
    }
    if (query.doctorId)  filter.doctorId  = new Types.ObjectId(query.doctorId);
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status)    filter.status    = query.status as any;

    const page     = query.page     ?? 1;
    const pageSize = query.pageSize ?? 50;
    const [docs, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledAt: 1 })
        .skip((page - 1) * pageSize).limit(pageSize).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items: await this.hydrateMany(docs), total };
  }

  async getById(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Цаг олдсонгүй");
    return this.toShared(doc);
  }

  async checkIn(id: string, actor: AuthUser) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Цаг олдсонгүй");
    if (doc.status !== "scheduled") throw new BadRequestException("Энэ цаг хүлээлгэнд орох боломжгүй");

    const { start, end } = this.dayBounds(doc.scheduledAt.toISOString());
    const max = await this.model.findOne({
      doctorId:    doc.doctorId,
      scheduledAt: { $gte: start, $lte: end },
      queueNumber: { $exists: true, $ne: null },
    }).sort({ queueNumber: -1 }).lean();

    doc.queueNumber = (max?.queueNumber ?? 0) + 1;
    doc.status = "waiting";
    doc.calledAt = new Date();
    await doc.save();
    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "appointment.check_in", resource: "appointment",
      resourceId: doc._id.toString(),
    });
    return this.toShared(doc);
  }

  async setStatus(
    id: string,
    status: "in_progress" | "completed" | "cancelled" | "no_show",
    actor: AuthUser,
  ) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Цаг олдсонгүй");
    doc.status = status;
    const now = new Date();
    if (status === "in_progress") doc.startedAt   = now;
    if (status === "completed")   doc.completedAt = now;
    await doc.save();
    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: `appointment.${status}`, resource: "appointment",
      resourceId: doc._id.toString(),
    });
    return this.toShared(doc);
  }

  async todayQueue(doctorId?: string) {
    const { start, end } = this.dayBounds(new Date().toISOString());
    const filter: FilterQuery<AppointmentDocument> = {
      scheduledAt: { $gte: start, $lte: end },
      status: { $in: ["waiting", "in_progress"] },
    };
    if (doctorId) filter.doctorId = new Types.ObjectId(doctorId);
    const docs = await this.model.find(filter).sort({ queueNumber: 1, scheduledAt: 1 }).exec();
    return this.hydrateMany(docs);
  }

  async countToday(): Promise<{ total: number; waiting: number }> {
    const { start, end } = this.dayBounds(new Date().toISOString());
    const filter: FilterQuery<AppointmentDocument> = { scheduledAt: { $gte: start, $lte: end } };
    const [total, waiting] = await Promise.all([
      this.model.countDocuments(filter),
      this.model.countDocuments({ ...filter, status: { $in: ["waiting", "scheduled"] } }),
    ]);
    return { total, waiting };
  }
}
