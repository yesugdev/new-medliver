import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import type { AuthUser, TreatmentTask } from "@his/shared";
import { TreatmentTaskEntity, TreatmentTaskDocument } from "./treatment-task.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { CreateTreatmentTaskDto, UpdateTreatmentTaskDto, ListTreatmentTasksDto } from "./dto/treatment-task.dto";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class TreatmentTaskService {
  constructor(
    @InjectModel(TreatmentTaskEntity.name)
    private readonly model: Model<TreatmentTaskDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
  ) {}

  private toShared(doc: TreatmentTaskDocument): TreatmentTask {
    return {
      id:            doc._id.toString(),
      patientId:      doc.patientId.toString(),
      patientName:    doc.patientName,
      patientCode:    doc.patientCode,
      registerNumber: doc.registerNumber,
      drugName:      doc.drugName,
      route:         doc.route,
      frequency:     doc.frequency,
      perDose:       doc.perDose,
      notes:         doc.notes,
      scheduledDate: doc.scheduledDate,
      status:        doc.status as TreatmentTask["status"],
      doneAt:        doc.doneAt?.toISOString(),
      doneById:      doc.doneById?.toString(),
      doneByName:    doc.doneByName,
      doneNote:      doc.doneNote,
      sourceRecordId: doc.sourceRecordId?.toString(),
      createdById:   doc.createdById.toString(),
      createdByName: doc.createdByName,
      createdAt:     (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async list(query: ListTreatmentTasksDto): Promise<TreatmentTask[]> {
    const filter: FilterQuery<TreatmentTaskDocument> = {};
    filter.scheduledDate = query.date ?? todayStr();
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId);
    if (query.status)    filter.status    = query.status;

    if (query.q?.trim()) {
      const safe = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: safe, $options: "i" };

      // Find patients whose registerNumber matches — for tasks that predate the field
      const matchedPatients = await this.patientModel
        .find({ registerNumber: regex })
        .select("_id")
        .lean()
        .exec();
      const matchedIds = matchedPatients.map((p) => new Types.ObjectId((p as any)._id));

      filter.$or = [
        { patientName:    regex },
        { patientCode:    regex },
        { drugName:       regex },
        { registerNumber: regex },
        ...(matchedIds.length > 0 ? [{ patientId: { $in: matchedIds } }] : []),
      ];
    }

    const docs = await this.model
      .find(filter)
      .sort({ status: 1, patientName: 1, drugName: 1 })
      .exec();
    return docs.map((d) => this.toShared(d));
  }

  async create(dto: CreateTreatmentTaskDto, actor: AuthUser): Promise<TreatmentTask> {
    // Fetch patient info — patientId provided, name/code from dto or lookup
    const doc = await this.model.create({
      patientId:     new Types.ObjectId(dto.patientId),
      patientName:   "—",   // will be updated by bulk create below
      patientCode:   "—",
      drugName:      dto.drugName,
      route:         dto.route,
      frequency:     dto.frequency,
      perDose:       dto.perDose,
      notes:         dto.notes,
      scheduledDate: dto.scheduledDate ?? todayStr(),
      createdById:   new Types.ObjectId(actor.id),
      createdByName: actor.fullName ?? actor.email,
    });
    return this.toShared(doc);
  }

  /** Called by TreatmentService after saving a prescription */
  async createFromRecord(params: {
    patientId: string;
    patientName: string;
    patientCode: string;
    registerNumber?: string;
    drugs: Array<{
      drugName: string;
      route?: string;
      frequency?: number;
      perDose?: number;
      duration?: number;
      scheduleDates?: string[];
      notes?: string;
    }>;
    sourceRecordId: string;
    actor: AuthUser;
  }): Promise<void> {
    const { patientId, patientName, patientCode, registerNumber, drugs, sourceRecordId, actor } = params;
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

    const docs = drugs.flatMap((d) => {
      // Тохируулсан огноонууд (завсартай байж болно), эс бөгөөс өнөөдрөөс duration хоног дараалан
      const picked = (d.scheduleDates ?? []).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
      const dates: string[] = picked.length > 0
        ? picked
        : Array.from({ length: Math.max(d.duration ?? 1, 1) }, (_, i) => {
            const dt = new Date(today);
            dt.setDate(today.getDate() + i);
            return fmt(dt);
          });

      return dates.map((scheduledDate) => ({
        patientId:     new Types.ObjectId(patientId),
        patientName,
        patientCode,
        registerNumber,
        drugName:      d.drugName,
        route:         d.route,
        frequency:     d.frequency,
        perDose:       d.perDose,
        notes:         d.notes,
        scheduledDate,
        sourceRecordId: new Types.ObjectId(sourceRecordId),
        createdById:   new Types.ObjectId(actor.id),
        createdByName: actor.fullName ?? actor.email,
      }));
    });

    if (docs.length > 0) {
      await this.model.insertMany(docs);
    }
  }

  async updateStatus(id: string, dto: UpdateTreatmentTaskDto, actor: AuthUser): Promise<TreatmentTask> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Даалгавар олдсонгүй");

    doc.status = dto.status;
    if (dto.status === "done") {
      doc.doneAt     = new Date();
      doc.doneById   = new Types.ObjectId(actor.id);
      doc.doneByName = actor.fullName ?? actor.email;
      doc.doneNote   = dto.doneNote;
    } else {
      doc.doneAt     = undefined;
      doc.doneById   = undefined;
      doc.doneByName = undefined;
      doc.doneNote   = undefined;
    }

    await doc.save();
    return this.toShared(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  /** Өнөөдөр хийх (хүлээгдэж буй) эмчилгээний тоо */
  async countToday(): Promise<number> {
    return this.model.countDocuments({ scheduledDate: todayStr(), status: "pending" });
  }
}
