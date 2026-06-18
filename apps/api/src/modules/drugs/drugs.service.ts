import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type {
  Drug, DrugBatch, StockMovement, DrugReport, StockMovementType,
} from "@his/shared";
import { DrugEntity, DrugDocument } from "./drug.schema";
import { DrugBatchEntity, DrugBatchDocument } from "./drug-batch.schema";
import { StockMovementEntity, StockMovementDocument } from "./stock-movement.schema";
import { CreateDrugDto, UpdateDrugDto, CreateBatchDto } from "./dto/drug.dto";

export interface MovementActor {
  id?: string;
  name?: string;
}

export interface DeductOptions {
  refType?: string;
  refId?: string;
  reason?: string;
  movementType?: StockMovementType; // default "out"
  actor?: MovementActor;
}

const FAR_FUTURE = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d;
};

@Injectable()
export class DrugsService {
  constructor(
    @InjectModel(DrugEntity.name)
    private readonly model: Model<DrugDocument>,
    @InjectModel(DrugBatchEntity.name)
    private readonly batchModel: Model<DrugBatchDocument>,
    @InjectModel(StockMovementEntity.name)
    private readonly movementModel: Model<StockMovementDocument>,
  ) {}

  private toShared(doc: DrugDocument): Drug {
    return {
      id:           doc._id.toString(),
      name:         doc.name,
      form:         doc.form,
      dosage:       doc.dosage,
      unit:         doc.unit,
      category:     doc.category,
      manufacturer: doc.manufacturer,
      salePrice:    doc.salePrice ?? 0,
      stock:        doc.stock,
      minStock:     doc.minStock,
      description:  doc.description,
      isActive:     doc.isActive,
      createdAt:    (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt:    (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private batchToShared(doc: DrugBatchDocument): DrugBatch {
    return {
      id:              doc._id.toString(),
      drugId:          doc.drugId.toString(),
      batchNumber:     doc.batchNumber,
      expiryDate:      doc.expiryDate.toISOString(),
      quantity:        doc.quantity,
      initialQuantity: doc.initialQuantity,
      costPrice:       doc.costPrice,
      receivedAt:      doc.receivedAt.toISOString(),
      createdAt:       (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private movementToShared(doc: StockMovementDocument): StockMovement {
    return {
      id:            doc._id.toString(),
      drugId:        doc.drugId.toString(),
      batchId:       doc.batchId?.toString(),
      type:          doc.type,
      quantity:      doc.quantity,
      reason:        doc.reason,
      refType:       doc.refType,
      refId:         doc.refId,
      createdBy:     doc.createdBy,
      createdByName: doc.createdByName,
      createdAt:     (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /* ── CRUD ──────────────────────────────────────────────────────── */
  async list(activeOnly = true): Promise<Drug[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await this.model.find(filter).sort({ name: 1 }).exec();
    return docs.map((d) => this.toShared(d));
  }

  async getById(id: string): Promise<Drug> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    return this.toShared(doc);
  }

  async create(dto: CreateDrugDto, actor?: MovementActor): Promise<Drug> {
    const doc = await this.model.create({
      name:         dto.name,
      form:         dto.form,
      dosage:       dto.dosage,
      unit:         dto.unit,
      category:     dto.category,
      manufacturer: dto.manufacturer,
      salePrice:    dto.salePrice ?? 0,
      stock:        0,
      minStock:     dto.minStock ?? 0,
      description:  dto.description,
    });

    // Анхны нөөц өгсөн бол эхний цуврал автоматаар үүсгэнэ
    if (dto.stock && dto.stock > 0) {
      await this.batchModel.create({
        drugId:          doc._id,
        batchNumber:     "INIT",
        expiryDate:      FAR_FUTURE(),
        quantity:        dto.stock,
        initialQuantity: dto.stock,
        costPrice:       0,
        receivedAt:      new Date(),
      });
      await this.movementModel.create({
        drugId:        doc._id,
        type:          "in",
        quantity:      dto.stock,
        reason:        "Анхны нөөц",
        createdBy:     actor?.id,
        createdByName: actor?.name,
      });
      await this.recomputeStock(doc._id.toString());
      return this.getById(doc._id.toString());
    }

    return this.toShared(doc);
  }

  async update(id: string, dto: UpdateDrugDto): Promise<Drug> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    Object.assign(doc, dto);
    await doc.save();
    return this.toShared(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    doc.isActive = false;
    await doc.save();
  }

  /* ── Цуврал / нөөц ─────────────────────────────────────────────── */
  private async recomputeStock(drugId: string): Promise<void> {
    const agg = await this.batchModel.aggregate([
      { $match: { drugId: new Types.ObjectId(drugId) } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const total = agg[0]?.total ?? 0;
    await this.model.updateOne({ _id: drugId }, { $set: { stock: total } });
  }

  /** Орлого — шинэ цуврал нэмэх */
  async addBatch(drugId: string, dto: CreateBatchDto, actor?: MovementActor): Promise<DrugBatch> {
    const drug = await this.model.findById(drugId).exec();
    if (!drug) throw new NotFoundException("Эм олдсонгүй");

    const batch = await this.batchModel.create({
      drugId:          drug._id,
      batchNumber:     dto.batchNumber,
      expiryDate:      new Date(dto.expiryDate),
      quantity:        dto.quantity,
      initialQuantity: dto.quantity,
      costPrice:       dto.costPrice,
      receivedAt:      dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
    });
    await this.movementModel.create({
      drugId:        drug._id,
      batchId:       batch._id,
      type:          "in",
      quantity:      dto.quantity,
      reason:        `Орлого — цуврал ${dto.batchNumber}`,
      createdBy:     actor?.id,
      createdByName: actor?.name,
    });
    await this.recomputeStock(drugId);
    return this.batchToShared(batch);
  }

  async listBatches(drugId: string): Promise<DrugBatch[]> {
    const docs = await this.batchModel
      .find({ drugId: new Types.ObjectId(drugId) })
      .sort({ expiryDate: 1 })
      .exec();
    return docs.map((b) => this.batchToShared(b));
  }

  async listMovements(drugId: string): Promise<StockMovement[]> {
    const docs = await this.movementModel
      .find({ drugId: new Types.ObjectId(drugId) })
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
    return docs.map((m) => this.movementToShared(m));
  }

  /**
   * FEFO-гоор нөөц хасах. Эхэлж дуусах цуврлаас түрүүлж хасна.
   * Буцаах: бодитоор хассан тоо + нийт өртөг.
   */
  async deductFEFO(
    drugId: string,
    qty: number,
    opts: DeductOptions = {},
  ): Promise<{ deducted: number; totalCost: number }> {
    if (!qty || qty <= 0) return { deducted: 0, totalCost: 0 };
    const movementType: StockMovementType = opts.movementType ?? "out";

    const batches = await this.batchModel
      .find({ drugId: new Types.ObjectId(drugId), quantity: { $gt: 0 } })
      .sort({ expiryDate: 1 })
      .exec();

    let remaining = qty;
    let totalCost = 0;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      batch.quantity -= take;
      await batch.save();
      remaining -= take;
      totalCost += take * batch.costPrice;
      await this.movementModel.create({
        drugId:        new Types.ObjectId(drugId),
        batchId:       batch._id,
        type:          movementType,
        quantity:      -take,
        reason:        opts.reason,
        refType:       opts.refType,
        refId:         opts.refId,
        createdBy:     opts.actor?.id,
        createdByName: opts.actor?.name,
      });
    }
    await this.recomputeStock(drugId);
    return { deducted: qty - remaining, totalCost };
  }

  /** Нэхэмжлэл цуцлах үед refId-аар хасагдсан нөөцийг буцаах */
  async reverseFEFO(refId: string, actor?: MovementActor): Promise<void> {
    // Давхар буцаахаас сэргийлэх
    const alreadyReversed = await this.movementModel.exists({ refId, refType: "reversal" });
    if (alreadyReversed) return;

    const outs = await this.movementModel
      .find({ refId, type: "out" })
      .exec();

    const affectedDrugs = new Set<string>();
    for (const m of outs) {
      const addBack = -m.quantity; // m.quantity сөрөг тул эерэг болно
      if (m.batchId) {
        await this.batchModel.updateOne({ _id: m.batchId }, { $inc: { quantity: addBack } });
      }
      await this.movementModel.create({
        drugId:        m.drugId,
        batchId:       m.batchId,
        type:          "in",
        quantity:      addBack,
        reason:        "Нэхэмжлэл цуцлалт",
        refType:       "reversal",
        refId,
        createdBy:     actor?.id,
        createdByName: actor?.name,
      });
      affectedDrugs.add(m.drugId.toString());
    }
    for (const id of affectedDrugs) await this.recomputeStock(id);
  }

  /** Гар тохируулга (admin). delta>0 нэмэх, delta<0 хасах */
  async adjustStock(drugId: string, delta: number, actor?: MovementActor): Promise<void> {
    const drug = await this.model.findById(drugId).exec();
    if (!drug) throw new NotFoundException("Эм олдсонгүй");

    if (delta > 0) {
      const batch = await this.batchModel.create({
        drugId:          drug._id,
        batchNumber:     "ADJUST",
        expiryDate:      FAR_FUTURE(),
        quantity:        delta,
        initialQuantity: delta,
        costPrice:       0,
        receivedAt:      new Date(),
      });
      await this.movementModel.create({
        drugId:        drug._id,
        batchId:       batch._id,
        type:          "adjust",
        quantity:      delta,
        reason:        "Гар тохируулга",
        createdBy:     actor?.id,
        createdByName: actor?.name,
      });
      await this.recomputeStock(drugId);
    } else if (delta < 0) {
      await this.deductFEFO(drugId, -delta, {
        movementType: "adjust",
        reason: "Гар тохируулга",
        actor,
      });
    }
  }

  /* ── Тайлан ────────────────────────────────────────────────────── */
  async listExpiring(days = 30): Promise<DrugBatch[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const docs = await this.batchModel
      .find({ quantity: { $gt: 0 }, expiryDate: { $lte: limit } })
      .sort({ expiryDate: 1 })
      .exec();
    return docs.map((b) => this.batchToShared(b));
  }

  async reports(): Promise<DrugReport> {
    const drugs = await this.model.find({ isActive: true }).lean();

    const valAgg = await this.batchModel.aggregate([
      { $match: { quantity: { $gt: 0 } } },
      {
        $group: {
          _id: "$drugId",
          valuation: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        },
      },
    ]);
    const valByDrug = new Map<string, number>(
      valAgg.map((v: any) => [v._id.toString(), v.valuation]),
    );

    const lowStock = drugs
      .filter((d) => d.minStock > 0 && d.stock <= d.minStock)
      .map((d) => ({
        drugId:    d._id.toString(),
        name:      d.name,
        unit:      d.unit,
        stock:     d.stock,
        minStock:  d.minStock,
        valuation: valByDrug.get(d._id.toString()) ?? 0,
      }));

    const totalValuation = Array.from(valByDrug.values()).reduce((s, v) => s + v, 0);

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    const [expiringDocs, expiredDocs] = await Promise.all([
      this.batchModel
        .find({ quantity: { $gt: 0 }, expiryDate: { $gt: now, $lte: soon } })
        .sort({ expiryDate: 1 })
        .exec(),
      this.batchModel
        .find({ quantity: { $gt: 0 }, expiryDate: { $lte: now } })
        .sort({ expiryDate: 1 })
        .exec(),
    ]);

    return {
      totalValuation,
      totalDrugs: drugs.length,
      lowStock,
      expiringSoon: expiringDocs.map((b) => this.batchToShared(b)),
      expired:      expiredDocs.map((b) => this.batchToShared(b)),
    };
  }
}
