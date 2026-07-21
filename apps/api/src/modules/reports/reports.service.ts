import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type {
  PatientReport,
  LaboratoryReport,
  FinancialReport,
  DateCount,
  ReportUserStat,
} from "@his/shared";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { Treatment, TreatmentDocument } from "../patients/treatment.schema";
import { LabOrder, LabOrderDocument } from "../lab/lab-order.schema";
import { Invoice, InvoiceDocument } from "../billing/invoice.schema";
import { User, UserDocument } from "../users/user.schema";

const ABNORMAL_INTERPRETATIONS = ["low", "high", "critical_low", "critical_high", "abnormal"];

const AGE_BUCKETS = ["0-5", "6-17", "18-29", "30-44", "45-59", "60+"];

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Patient.name)   private readonly patientModel:   Model<PatientDocument>,
    @InjectModel(Treatment.name) private readonly treatmentModel: Model<TreatmentDocument>,
    @InjectModel(LabOrder.name)  private readonly labModel:       Model<LabOrderDocument>,
    @InjectModel(Invoice.name)   private readonly invoiceModel:   Model<InvoiceDocument>,
    @InjectModel(User.name)      private readonly userModel:      Model<UserDocument>,
  ) {}

  /* ── Helpers ─────────────────────────────────────────────────────── */

  private resolveRange(from?: string, to?: string) {
    const now = new Date();
    const start = from
      ? new Date(`${from}T00:00:00.000`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = to
      ? new Date(`${to}T23:59:59.999`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  private boundaries() {
    const now = new Date();
    return {
      todayStart: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
      yearStart:  new Date(now.getFullYear(), 0, 1),
    };
  }

  /** userId string → { name, role } (ObjectId эсвэл string аль алинд ажиллана) */
  private async userMap(ids: (string | undefined | null)[]): Promise<Map<string, { name: string; role: string }>> {
    const valid = [...new Set(ids.filter((id): id is string => !!id && Types.ObjectId.isValid(id)))];
    const users = await this.userModel
      .find({ _id: { $in: valid.map((id) => new Types.ObjectId(id)) } })
      .select("fullName role")
      .lean();
    const map = new Map<string, { name: string; role: string }>();
    for (const u of users) map.set(u._id.toString(), { name: u.fullName, role: u.role as string });
    return map;
  }

  private byUserFromCounts(
    counts: { _id: string | null; count: number }[],
    users: Map<string, { name: string; role: string }>,
  ): ReportUserStat[] {
    return counts
      .map((c) => {
        const id = c._id ? String(c._id) : "";
        const u = id ? users.get(id) : undefined;
        return {
          userId: id,
          name: u?.name ?? "Тодорхойгүй",
          role: u?.role ?? "—",
          count: c.count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  private fillDaily(rows: { _id: string; count: number }[]): DateCount[] {
    return rows
      .filter((r) => r._id)
      .map((r) => ({ date: r._id, count: r.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /* ── 1. Patient report ───────────────────────────────────────────── */
  async patientReport(from?: string, to?: string): Promise<PatientReport> {
    const { start, end } = this.resolveRange(from, to);
    const { todayStart } = this.boundaries();
    const notDeleted = { deletedAt: null };
    const inRange = { createdAt: { $gte: start, $lte: end }, ...notDeleted };

    const [
      todayRegistered,
      totalPatients,
      todayTreatments,
      newPatients,
      returningAgg,
      genderAgg,
      ageAgg,
      byUserAgg,
      treatmentTotal,
      topTypesAgg,
      treatmentDailyAgg,
      dailyRegAgg,
    ] = await Promise.all([
      this.patientModel.countDocuments({ createdAt: { $gte: todayStart }, ...notDeleted }),
      this.patientModel.countDocuments(notDeleted),
      this.treatmentModel.countDocuments({ createdAt: { $gte: todayStart } }),
      this.patientModel.countDocuments(inRange),
      this.treatmentModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$patientId" } },
        { $lookup: { from: "patients", localField: "_id", foreignField: "_id", as: "p" } },
        { $unwind: "$p" },
        { $match: { "p.createdAt": { $lt: start }, "p.deletedAt": null } },
        { $count: "n" },
      ]),
      this.patientModel.aggregate([
        { $match: inRange },
        { $group: { _id: "$gender", count: { $sum: 1 } } },
      ]),
      this.patientModel.aggregate([
        { $match: inRange },
        { $addFields: { ageYears: { $dateDiff: { startDate: "$birthDate", endDate: "$$NOW", unit: "year" } } } },
        {
          $addFields: {
            bucket: {
              $switch: {
                branches: [
                  { case: { $lte: ["$ageYears", 5] },  then: "0-5" },
                  { case: { $lte: ["$ageYears", 17] }, then: "6-17" },
                  { case: { $lte: ["$ageYears", 29] }, then: "18-29" },
                  { case: { $lte: ["$ageYears", 44] }, then: "30-44" },
                  { case: { $lte: ["$ageYears", 59] }, then: "45-59" },
                ],
                default: "60+",
              },
            },
          },
        },
        { $group: { _id: "$bucket", count: { $sum: 1 } } },
      ]),
      this.patientModel.aggregate([
        { $match: inRange },
        { $group: { _id: "$createdBy", count: { $sum: 1 } } },
      ]),
      this.treatmentModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      this.treatmentModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$drugs" },
        { $group: { _id: "$drugs.nameFormDosage", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      this.treatmentModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      this.patientModel.aggregate([
        { $match: inRange },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
    ]);

    const genderMap = new Map(genderAgg.map((g: any) => [g._id, g.count]));
    const ageMap = new Map(ageAgg.map((a: any) => [a._id, a.count]));
    const users = await this.userMap(byUserAgg.map((u: any) => u._id));

    return {
      kpi: {
        todayRegistered,
        totalPatients,
        todayTreatments,
        returningPatients: returningAgg[0]?.n ?? 0,
        newPatients,
      },
      gender: {
        male:   genderMap.get("male") ?? 0,
        female: genderMap.get("female") ?? 0,
        other:  genderMap.get("other") ?? 0,
      },
      ageGroups: AGE_BUCKETS.map((label) => ({ label, count: ageMap.get(label) ?? 0 })),
      byUser: this.byUserFromCounts(byUserAgg as any, users),
      treatment: {
        total: treatmentTotal,
        topTypes: (topTypesAgg as any[]).map((t) => ({ name: t._id ?? "—", count: t.count })),
        daily: this.fillDaily(treatmentDailyAgg as any),
      },
      dailyRegistrations: this.fillDaily(dailyRegAgg as any),
    };
  }

  /* ── 2. Laboratory report ────────────────────────────────────────── */
  async laboratoryReport(from?: string, to?: string): Promise<LaboratoryReport> {
    const { start, end } = this.resolveRange(from, to);
    const match = { orderedAt: { $gte: start, $lte: end }, deletedAt: null };

    const [kpiAgg, byTypeAgg, byUserAgg, dailyAgg, topTestsAgg] = await Promise.all([
      this.labModel.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            total:     { $sum: 1 },
            resulted:  { $sum: { $cond: [{ $eq: ["$items.status", "resulted"] }, 1, 0] } },
            pending:   { $sum: { $cond: [{ $eq: ["$items.status", "ordered"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$items.status", "cancelled"] }, 1, 0] } },
            normal:    { $sum: { $cond: [{ $eq: ["$items.interpretation", "normal"] }, 1, 0] } },
            abnormal:  { $sum: { $cond: [{ $in: ["$items.interpretation", ABNORMAL_INTERPRETATIONS] }, 1, 0] } },
          },
        },
      ]),
      this.labModel.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: { $ifNull: ["$items.testGroup", "$items.testName"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      this.labModel.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: "$doctorId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.labModel.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" } }, count: { $sum: 1 } } },
      ]),
      this.labModel.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: "$items.testName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const k = kpiAgg[0] ?? {};
    const users = await this.userMap((byUserAgg as any[]).map((u) => (u._id ? String(u._id) : "")));

    return {
      kpi: {
        totalTests: k.total ?? 0,
        resulted:   k.resulted ?? 0,
        pending:    k.pending ?? 0,
        normal:     k.normal ?? 0,
        abnormal:   k.abnormal ?? 0,
      },
      byType: (byTypeAgg as any[]).map((t) => ({ label: t._id ?? "—", count: t.count })),
      status: {
        resulted:  k.resulted ?? 0,
        pending:   k.pending ?? 0,
        cancelled: k.cancelled ?? 0,
      },
      byUser: this.byUserFromCounts(byUserAgg as any, users),
      daily: this.fillDaily(dailyAgg as any),
      normalAbnormal: { normal: k.normal ?? 0, abnormal: k.abnormal ?? 0 },
      topTests: (topTestsAgg as any[]).map((t) => ({ name: t._id ?? "—", count: t.count })),
    };
  }

  /* ── 3. Financial report ─────────────────────────────────────────── */
  private async sumPaymentsSince(date: Date): Promise<number> {
    const res = await this.invoiceModel.aggregate([
      { $match: { deletedAt: null, status: { $ne: "cancelled" } } },
      { $unwind: "$payments" },
      { $match: { "payments.paidAt": { $gte: date } } },
      { $group: { _id: null, sum: { $sum: "$payments.amount" } } },
    ]);
    return res[0]?.sum ?? 0;
  }

  async financialReport(from?: string, to?: string): Promise<FinancialReport> {
    const { start, end } = this.resolveRange(from, to);
    const { todayStart, monthStart, yearStart } = this.boundaries();
    const notCancelled = { deletedAt: null, status: { $ne: "cancelled" } };
    const paymentInRange = { "payments.paidAt": { $gte: start, $lte: end } };
    const issuedInRange = { issuedAt: { $gte: start, $lte: end }, ...notCancelled };

    // 12 сарын тренд — trailing 12 months
    const trendStart = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);

    const [
      todayRevenue, monthRevenue, yearRevenue,
      rangeAgg, byMethodAgg, dailyAgg, monthlyAgg,
      discountAgg, byServiceAgg, byUserAgg,
    ] = await Promise.all([
      this.sumPaymentsSince(todayStart),
      this.sumPaymentsSince(monthStart),
      this.sumPaymentsSince(yearStart),
      this.invoiceModel.aggregate([
        { $match: notCancelled },
        { $unwind: "$payments" },
        { $match: paymentInRange },
        { $group: { _id: null, amount: { $sum: "$payments.amount" }, count: { $sum: 1 } } },
      ]),
      this.invoiceModel.aggregate([
        { $match: notCancelled },
        { $unwind: "$payments" },
        { $match: paymentInRange },
        { $group: { _id: "$payments.method", count: { $sum: 1 }, amount: { $sum: "$payments.amount" } } },
        { $sort: { amount: -1 } },
      ]),
      this.invoiceModel.aggregate([
        { $match: notCancelled },
        { $unwind: "$payments" },
        { $match: paymentInRange },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$payments.paidAt" } },
            amount: { $sum: "$payments.amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      this.invoiceModel.aggregate([
        { $match: notCancelled },
        { $unwind: "$payments" },
        { $match: { "payments.paidAt": { $gte: trendStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$payments.paidAt" } },
            amount: { $sum: "$payments.amount" },
          },
        },
      ]),
      this.invoiceModel.aggregate([
        { $match: { ...issuedInRange, discount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$discount" }, patients: { $addToSet: "$patientId" }, invoices: { $sum: 1 } } },
      ]),
      this.invoiceModel.aggregate([
        { $match: issuedInRange },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $ifNull: ["$items.category", "Бусад"] },
            count: { $sum: "$items.quantity" },
            amount: { $sum: "$items.total" },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      this.invoiceModel.aggregate([
        { $match: issuedInRange },
        { $group: { _id: "$createdBy", amount: { $sum: "$total" }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const range = rangeAgg[0] ?? { amount: 0, count: 0 };
    const disc = discountAgg[0];
    const users = await this.userMap((byUserAgg as any[]).map((u) => (u._id ? String(u._id) : "")));

    // trailing 12 months бүрэн бөглөх
    const monthlyMap = new Map((monthlyAgg as any[]).map((m) => [m._id, m.amount]));
    const monthlyTrend: { month: string; amount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(trendStart.getFullYear(), trendStart.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrend.push({ month: key, amount: monthlyMap.get(key) ?? 0 });
    }

    return {
      kpi: {
        todayRevenue,
        monthRevenue,
        yearRevenue,
        rangeRevenue: range.amount,
        paymentsCount: range.count,
        avgPayment: range.count > 0 ? Math.round(range.amount / range.count) : 0,
      },
      byMethod: (byMethodAgg as any[]).map((m) => ({ method: m._id ?? "—", count: m.count, amount: m.amount })),
      dailyRevenue: (dailyAgg as any[])
        .filter((d) => d._id)
        .map((d) => ({ date: d._id, amount: d.amount, count: d.count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      monthlyTrend,
      discount: {
        total: disc?.total ?? 0,
        patients: disc?.patients?.length ?? 0,
        avg: disc && disc.invoices > 0 ? Math.round(disc.total / disc.invoices) : 0,
      },
      byService: (byServiceAgg as any[]).map((s) => ({ category: s._id ?? "Бусад", count: s.count, amount: s.amount })),
      byUser: (byUserAgg as any[])
        .map((u) => {
          const id = u._id ? String(u._id) : "";
          const usr = id ? users.get(id) : undefined;
          return { userId: id, name: usr?.name ?? "Тодорхойгүй", role: usr?.role ?? "—", amount: u.amount };
        })
        .sort((a, b) => b.amount - a.amount),
    };
  }
}
