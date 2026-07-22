import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import type { AuthUser, LabOrder as SharedOrder, LabTest as SharedTest } from "@his/shared";
import { LabTest, LabTestDocument } from "./lab-test.schema";
import { LabOrder, LabOrderDocument, LabOrderItem } from "./lab-order.schema";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { User, UserDocument } from "../users/user.schema";
import { AuditService } from "../audit/audit.service";
import { LabCategoriesService } from "../lab-categories/lab-categories.service";
import { CreateLabTestDto } from "./dto/create-lab-test.dto";
import { UpdateLabTestDto } from "./dto/update-lab-test.dto";
import { CreateLabOrderDto } from "./dto/create-lab-order.dto";
import { RecordResultsDto } from "./dto/record-results.dto";
import { QuickResultDto } from "./dto/quick-result.dto";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { UpdateOrderDateDto } from "./dto/update-order-date.dto";

/* ─── Interpretation helper ─────────────────────────────────────────── */
function autoInterpret(
  value: string,
  refMin?: number,
  refMax?: number,
): string | undefined {
  const num = parseFloat(value);
  if (isNaN(num) || (refMin == null && refMax == null)) return undefined;

  if (refMin != null && num < refMin * 0.7) return "critical_low";
  if (refMax != null && num > refMax * 1.3) return "critical_high";
  if (refMin != null && num < refMin)        return "low";
  if (refMax != null && num > refMax)        return "high";
  return "normal";
}

/* ─── Order status from items ───────────────────────────────────────── */
function computeOrderStatus(items: LabOrderItem[]): string {
  const active = items.filter((i) => i.status !== "cancelled");
  if (active.length === 0) return "cancelled";
  const resulted = active.filter((i) => i.status === "resulted").length;
  if (resulted === 0) return "ordered";
  if (resulted === active.length) return "completed";
  return "partial";
}

/* ─── Auto order number ─────────────────────────────────────────────── */
async function nextOrderNumber(model: Model<LabOrderDocument>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LAB${year}-`;
  const last = await model
    .findOne({ orderNumber: { $regex: `^${prefix}` } })
    .sort({ orderNumber: -1 })
    .lean();
  const seq = last
    ? parseInt(last.orderNumber.replace(prefix, ""), 10) + 1
    : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

@Injectable()
export class LabService {
  constructor(
    @InjectModel(LabTest.name)  private readonly testModel:  Model<LabTestDocument>,
    @InjectModel(LabOrder.name) private readonly orderModel: Model<LabOrderDocument>,
    @InjectModel(Patient.name)  private readonly patientModel: Model<PatientDocument>,
    @InjectModel(User.name)     private readonly userModel:   Model<UserDocument>,
    private readonly audit: AuditService,
    private readonly categories: LabCategoriesService,
  ) {}

  /* ── Shared converters ─────────────────────────────────────────────── */
  private testToShared(doc: LabTestDocument): SharedTest {
    return {
      id:               doc._id.toString(),
      code:             doc.code,
      name:             doc.name,
      nameEn:           doc.nameEn,
      category:         doc.category as any,
      testGroup:        doc.testGroup,
      unit:             doc.unit,
      referenceMin:     doc.referenceMin,
      referenceMax:     doc.referenceMax,
      referenceText:    doc.referenceText,
      inputType:        (doc.inputType ?? "text") as "text" | "select",
      options:          doc.options,
      turnaroundHours:  doc.turnaroundHours,
      sortOrder:        doc.sortOrder,
      isActive:         doc.isActive,
      createdAt:        (doc as any).createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt:        (doc as any).updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  /** Batch-hydrates multiple orders (single patient+user DB round-trips) */
  private async hydrateOrders(docs: LabOrderDocument[]): Promise<SharedOrder[]> {
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
        id:           doc._id.toString(),
        orderNumber:  doc.orderNumber,
        patientId:    doc.patientId.toString(),
        patientName:  p ? `${p.lastName} ${p.firstName}` : "—",
        patientCode:  p?.patientCode ?? "—",
        doctorId:     doc.doctorId.toString(),
        doctorName:   d?.fullName ?? "—",
        visitId:      doc.visitId?.toString(),
        orderedAt:    doc.orderedAt.toISOString(),
        status:       doc.status as any,
        priority:     doc.priority as any,
        clinicalNote: doc.clinicalNote,
        labName:      doc.labName,
        items: doc.items.map((item) => ({
          testId:         item.testId.toString(),
          testCode:       item.testCode,
          testName:       item.testName,
          testGroup:      item.testGroup,
          unit:           item.unit,
          referenceMin:   item.referenceMin,
          referenceMax:   item.referenceMax,
          referenceText:  item.referenceText,
          inputType:      (item.inputType ?? "text") as "text" | "select",
          options:        item.options,
          status:         item.status as any,
          value:          item.value,
          interpretation: item.interpretation as any,
          notes:          item.notes,
          resultedAt:     item.resultedAt?.toISOString(),
          resultedByName: item.resultedByName,
        })),
        createdAt: (doc as any).createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: (doc as any).updatedAt?.toISOString() ?? new Date().toISOString(),
      };
    });
  }

  /* ── Test catalog ──────────────────────────────────────────────────── */
  async listTests(includeInactive = false): Promise<SharedTest[]> {
    const filter = includeInactive ? {} : { isActive: true };
    const docs = await this.testModel
      .find(filter)
      .sort({ category: 1, name: 1 })
      .lean();
    return docs.map((d) => this.testToShared(d as LabTestDocument));
  }

  async createTest(dto: CreateLabTestDto, actor: AuthUser): Promise<SharedTest> {
    const exists = await this.testModel.findOne({ code: dto.code.toUpperCase() }).lean();
    if (exists) throw new BadRequestException(`Код '${dto.code}' аль хэдийн бүртгэгдсэн`);

    if (dto.category && !(await this.categories.exists(dto.category)))
      throw new BadRequestException(`'${dto.category}' ангилал олдсонгүй`);

    const doc = await this.testModel.create({ ...dto, code: dto.code.toUpperCase(), isActive: true });
    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_test.create", resource: "lab_test", resourceId: doc._id.toString(),
    });
    return this.testToShared(doc);
  }

  async updateTest(id: string, dto: UpdateLabTestDto, actor: AuthUser): Promise<SharedTest> {
    const doc = await this.testModel.findById(id).exec();
    if (!doc) throw new NotFoundException("Шинжилгээний код олдсонгүй");

    if (dto.category !== undefined && !(await this.categories.exists(dto.category)))
      throw new BadRequestException(`'${dto.category}' ангилал олдсонгүй`);

    if (dto.code !== undefined)           doc.code          = dto.code.toUpperCase();
    if (dto.name !== undefined)           doc.name          = dto.name;
    if (dto.nameEn !== undefined)         doc.nameEn        = dto.nameEn;
    if (dto.category !== undefined)       doc.category      = dto.category as any;
    if (dto.testGroup !== undefined)      doc.testGroup     = dto.testGroup;
    if (dto.unit !== undefined)           doc.unit          = dto.unit;
    if (dto.referenceMin !== undefined)   doc.referenceMin  = dto.referenceMin;
    if (dto.referenceMax !== undefined)   doc.referenceMax  = dto.referenceMax;
    if (dto.referenceText !== undefined)  doc.referenceText = dto.referenceText;
    if (dto.turnaroundHours !== undefined) doc.turnaroundHours = dto.turnaroundHours;
    if (dto.inputType !== undefined)      doc.inputType     = dto.inputType as any;
    if (dto.options !== undefined)        doc.options       = dto.options;
    if (dto.sortOrder !== undefined)      doc.sortOrder     = dto.sortOrder;
    if (dto.isActive !== undefined)       doc.isActive      = dto.isActive;

    await doc.save();
    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_test.update", resource: "lab_test", resourceId: id,
    });
    return this.testToShared(doc);
  }

  /** Дараалсан id жагсаалтын дагуу sortOrder-ыг 0..n болгож дахин бичнэ */
  async reorderTests(ids: string[], actor: AuthUser): Promise<{ success: true }> {
    const ops = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { sortOrder: index } },
      },
    }));
    if (ops.length > 0) await this.testModel.bulkWrite(ops);

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_test.reorder", resource: "lab_test", resourceId: "bulk",
    });
    return { success: true };
  }

  /* ── Orders ────────────────────────────────────────────────────────── */
  async createOrder(dto: CreateLabOrderDto, actor: AuthUser): Promise<SharedOrder> {
    const [patient, tests] = await Promise.all([
      this.patientModel.findById(dto.patientId).lean(),
      this.testModel.find({ _id: { $in: dto.testIds }, isActive: true }).lean(),
    ]);
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");
    if (tests.length === 0) throw new BadRequestException("Шинжилгээ олдсонгүй");

    const orderNumber = await nextOrderNumber(this.orderModel);

    const items: Partial<LabOrderItem>[] = tests.map((t) => ({
      testId:        t._id as Types.ObjectId,
      testCode:      t.code,
      testName:      t.name,
      testGroup:     t.testGroup,
      unit:          t.unit,
      referenceMin:  t.referenceMin,
      referenceMax:  t.referenceMax,
      referenceText: t.referenceText,
      inputType:     t.inputType ?? "text",
      options:       t.options,
      status:        "ordered",
    }));

    const doc = await this.orderModel.create({
      orderNumber,
      patientId:   new Types.ObjectId(dto.patientId),
      doctorId:    new Types.ObjectId(actor.id),
      visitId:     dto.visitId ? new Types.ObjectId(dto.visitId) : undefined,
      orderedAt:   new Date(),
      status:      "ordered",
      priority:    dto.priority ?? "routine",
      clinicalNote: dto.clinicalNote,
      labName:     dto.labName?.trim() || undefined,
      items,
    });

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.create", resource: "lab_order", resourceId: doc._id.toString(),
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  /** Захиалга үүсгэлгүйгээр шууд хариу оруулах — нэг алхамд order+result үүсгэнэ */
  async quickResult(dto: QuickResultDto, actor: AuthUser): Promise<SharedOrder> {
    const testIds = dto.items.map((i) => i.testId);
    const [patient, tests] = await Promise.all([
      this.patientModel.findById(dto.patientId).lean(),
      this.testModel.find({ _id: { $in: testIds }, isActive: true }).lean(),
    ]);
    if (!patient) throw new BadRequestException("Өвчтөн олдсонгүй");
    if (tests.length === 0) throw new BadRequestException("Шинжилгээ олдсонгүй");

    const byName = (await this.userModel.findById(actor.id).lean())?.fullName ?? actor.email;
    const when = dto.date ? new Date(dto.date) : new Date();
    const inputByTest = new Map(dto.items.map((i) => [i.testId, i]));

    const items: Partial<LabOrderItem>[] = [];
    for (const t of tests) {
      const input = inputByTest.get((t._id as Types.ObjectId).toString());
      const value = input?.value?.trim() ?? "";
      if (!value) continue; // зөвхөн утга бөглөсөн шинжилгээ
      items.push({
        testId:        t._id as Types.ObjectId,
        testCode:      t.code,
        testName:      t.name,
        testGroup:     t.testGroup,
        unit:          t.unit,
        referenceMin:  t.referenceMin,
        referenceMax:  t.referenceMax,
        referenceText: t.referenceText,
        inputType:     (t.inputType ?? "text") as any,
        options:       t.options,
        status:        "resulted",
        value,
        interpretation: (autoInterpret(value, t.referenceMin, t.referenceMax)
          ?? (t.referenceText ? "normal" : undefined)) as any,
        notes:          input?.notes,
        resultedAt:     when,
        resultedById:   new Types.ObjectId(actor.id),
        resultedByName: byName,
      });
    }
    if (items.length === 0) throw new BadRequestException("Хариу оруулаагүй байна");

    const orderNumber = await nextOrderNumber(this.orderModel);
    const doc = await this.orderModel.create({
      orderNumber,
      patientId:  new Types.ObjectId(dto.patientId),
      doctorId:   new Types.ObjectId(actor.id),
      visitId:    dto.visitId ? new Types.ObjectId(dto.visitId) : undefined,
      orderedAt:  when,
      status:     "completed",
      priority:   "routine",
      labName:    dto.labName?.trim() || undefined,
      items,
    });
    doc.status = computeOrderStatus(doc.items) as any;
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.quick_result", resource: "lab_order", resourceId: doc._id.toString(),
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  async listOrders(query: ListOrdersDto, actor: AuthUser): Promise<{ items: SharedOrder[]; total: number }> {
    const filter: FilterQuery<LabOrderDocument> = {};

    if (query.patientId) {
      // Өвчтөний карт — тухайн өвчтөний БҮХ шинжилгээ (эмчээр хязгаарлахгүй)
      filter.patientId = new Types.ObjectId(query.patientId);
      if (query.doctorId) filter.doctorId = new Types.ObjectId(query.doctorId);
    } else {
      // Ерөнхий жагсаалт — эмч зөвхөн өөрийнхөө захиалгыг харна
      if (actor.role === "doctor") filter.doctorId = new Types.ObjectId(actor.id);
      else if (query.doctorId)     filter.doctorId = new Types.ObjectId(query.doctorId);
    }
    if (query.status)    filter.status    = query.status;
    if (query.from || query.to) {
      filter.orderedAt = {};
      if (query.from) filter.orderedAt.$gte = new Date(query.from);
      if (query.to)   filter.orderedAt.$lte = new Date(query.to + "T23:59:59");
    }

    const page     = query.page     ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ orderedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return { items: await this.hydrateOrders(docs), total };
  }

  async getOrder(id: string): Promise<SharedOrder> {
    const doc = await this.orderModel.findById(id).exec();
    if (!doc) throw new NotFoundException("Захиалга олдсонгүй");
    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  async recordResults(
    orderId: string,
    dto: RecordResultsDto,
    actor: AuthUser,
  ): Promise<SharedOrder> {
    const doc = await this.orderModel.findById(orderId).exec();
    if (!doc) throw new NotFoundException("Захиалга олдсонгүй");
    if (doc.status === "cancelled")
      throw new BadRequestException("Цуцлагдсан захиалгад хариу оруулах боломжгүй");

    const now      = new Date();
    const byName   = (await this.userModel.findById(actor.id).lean())?.fullName ?? actor.email;
    const inputMap = new Map(dto.items.map((i) => [i.testId, i]));

    for (const item of doc.items) {
      const input = inputMap.get(item.testId.toString());
      if (!input) continue;
      if (item.status === "cancelled") continue;

      item.value          = input.value.trim();
      item.notes          = input.notes ?? item.notes;
      item.interpretation = autoInterpret(input.value, item.referenceMin, item.referenceMax) as any
        ?? (item.referenceText ? "normal" : undefined);
      item.status         = "resulted";
      item.resultedAt     = now;
      item.resultedById   = new Types.ObjectId(actor.id);
      item.resultedByName = byName;
    }

    if (dto.labName !== undefined) doc.labName = dto.labName.trim() || undefined;

    doc.status = computeOrderStatus(doc.items) as any;
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.results_recorded", resource: "lab_order", resourceId: orderId,
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  /** Нэг тестийн хариуг устгаж, дахин "хүлээгдэж буй" төлөвт оруулна (зөвхөн admin) */
  async deleteResult(orderId: string, testId: string, actor: AuthUser): Promise<SharedOrder> {
    const doc = await this.orderModel.findById(orderId).exec();
    if (!doc) throw new NotFoundException("Захиалга олдсонгүй");

    const item = doc.items.find((i) => i.testId.toString() === testId);
    if (!item) throw new NotFoundException("Шинжилгээ олдсонгүй");
    if (item.status === "cancelled")
      throw new BadRequestException("Цуцлагдсан шинжилгээний хариуг устгах боломжгүй");
    if (item.status !== "resulted")
      throw new BadRequestException("Хариу оруулаагүй шинжилгээг устгах боломжгүй");

    item.value          = undefined;
    item.interpretation  = undefined;
    item.notes           = undefined;
    item.resultedAt      = undefined;
    item.resultedById    = undefined;
    item.resultedByName  = undefined;
    item.status          = "ordered";

    doc.status = computeOrderStatus(doc.items) as any;
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.result_deleted", resource: "lab_order", resourceId: orderId,
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  /** Захиалгын огноог засах — хариутай тестүүдийн бүртгэсэн огноог ч хамт шинэчилнэ (зөвхөн admin) */
  async updateOrderDate(orderId: string, dto: UpdateOrderDateDto, actor: AuthUser): Promise<SharedOrder> {
    const doc = await this.orderModel.findById(orderId).exec();
    if (!doc) throw new NotFoundException("Захиалга олдсонгүй");
    if (doc.status === "cancelled")
      throw new BadRequestException("Цуцлагдсан захиалгын огноог өөрчлөх боломжгүй");

    const newDate = new Date(dto.date);
    if (isNaN(newDate.getTime())) throw new BadRequestException("Огноо буруу байна");

    doc.orderedAt = newDate;
    for (const item of doc.items) {
      if (item.status === "resulted") item.resultedAt = newDate;
    }
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.date_updated", resource: "lab_order", resourceId: orderId,
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }

  async cancelOrder(id: string, actor: AuthUser): Promise<SharedOrder> {
    const doc = await this.orderModel.findById(id).exec();
    if (!doc) throw new NotFoundException("Захиалга олдсонгүй");
    if (doc.status === "completed")
      throw new BadRequestException("Дууссан захиалгыг цуцлах боломжгүй");

    doc.status = "cancelled";
    for (const item of doc.items) {
      if (item.status === "ordered") item.status = "cancelled";
    }
    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_order.cancel", resource: "lab_order", resourceId: id,
    });

    const [result] = await this.hydrateOrders([doc]);
    return result;
  }
}
