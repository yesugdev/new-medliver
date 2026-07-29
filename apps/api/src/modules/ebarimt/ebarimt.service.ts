import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type {
  AuthUser,
  EbarimtConfig,
  EbarimtInfo,
  EbarimtReceipt,
  UpdateEbarimtConfigInput,
} from "@his/shared";
import { EbarimtConfigEntity, EbarimtConfigDocument } from "./ebarimt-config.schema";
import { EbarimtReceiptEntity, EbarimtReceiptDocument } from "./ebarimt-receipt.schema";
import { Invoice, InvoiceDocument } from "../billing/invoice.schema";
import { AuditService } from "../audit/audit.service";

/** PosAPI руу хийх fetch — локал сервис тул богино timeout */
async function posApiFetch(url: string, init?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ServiceUnavailableException(
      "PosAPI-тай холбогдож чадсангүй. PosAPI сервис ажиллаж байгаа эсэхийг шалгана уу.",
    );
  }
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) {
    const msg = body?.message ?? text?.slice(0, 300) ?? res.statusText;
    throw new BadRequestException(`PosAPI алдаа (${res.status}): ${msg}`);
  }
  return body;
}

@Injectable()
export class EbarimtService {
  constructor(
    @InjectModel(EbarimtConfigEntity.name)
    private readonly configModel: Model<EbarimtConfigDocument>,
    @InjectModel(EbarimtReceiptEntity.name)
    private readonly receiptModel: Model<EbarimtReceiptDocument>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    private readonly audit: AuditService,
  ) {}

  /* ── Config ────────────────────────────────────────────────────── */

  private configToShared(doc: EbarimtConfigDocument): EbarimtConfig {
    return {
      id: doc._id.toString(),
      enabled: doc.enabled,
      posApiUrl: doc.posApiUrl,
      merchantTin: doc.merchantTin,
      districtCode: doc.districtCode,
      posNo: doc.posNo,
      classificationCode: doc.classificationCode,
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async getConfig(): Promise<EbarimtConfig> {
    let doc = await this.configModel.findOne().exec();
    if (!doc) doc = await this.configModel.create({});
    return this.configToShared(doc);
  }

  async updateConfig(dto: UpdateEbarimtConfigInput): Promise<EbarimtConfig> {
    const doc = await this.configModel
      .findOneAndUpdate({}, { $set: dto }, { new: true, upsert: true })
      .exec();
    return this.configToShared(doc!);
  }

  /** PosAPI байдал шалгах — Settings дэлгэцийн "Холболт шалгах" */
  async info(): Promise<EbarimtInfo> {
    const cfg = await this.getConfig();
    const base = cfg.posApiUrl.replace(/\/+$/, "");
    return posApiFetch(`${base}/rest/info`, { method: "GET" });
  }

  /* ── Receipt ───────────────────────────────────────────────────── */

  private receiptToShared(doc: EbarimtReceiptDocument): EbarimtReceipt {
    return {
      id: doc._id.toString(),
      invoiceId: doc.invoiceId.toString(),
      invoiceNumber: doc.invoiceNumber,
      ebarimtId: doc.ebarimtId,
      lottery: doc.lottery,
      qrData: doc.qrData,
      totalAmount: doc.totalAmount,
      totalVAT: doc.totalVAT,
      type: doc.type as EbarimtReceipt["type"],
      date: doc.date,
      status: doc.status,
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async getReceiptByInvoice(invoiceId: string): Promise<EbarimtReceipt | null> {
    const doc = await this.receiptModel
      .findOne({ invoiceId: new Types.ObjectId(invoiceId) })
      .exec();
    return doc ? this.receiptToShared(doc) : null;
  }

  /**
   * Нэхэмжлэлээс И-Баримт үүсгэнэ (PosAPI POST /rest/receipt).
   * Idempotent — өмнө нь гаргасан бол тухайн баримтыг буцаана (давхар гаргахгүй).
   */
  async createReceipt(invoiceId: string, actor: AuthUser): Promise<EbarimtReceipt> {
    const existing = await this.getReceiptByInvoice(invoiceId);
    if (existing) return existing;

    const cfg = await this.getConfig();
    if (!cfg.enabled)
      throw new BadRequestException("И-Баримт систем идэвхжээгүй байна (Тохиргоо → И-Баримт).");
    if (!cfg.merchantTin || !cfg.districtCode || !cfg.posNo)
      throw new BadRequestException("И-Баримт тохиргоо дутуу байна: ТТД, дүүргийн код, кассын дугаар.");

    const inv = await this.invoiceModel.findById(invoiceId).exec();
    if (!inv) throw new NotFoundException("Нэхэмжлэл олдсонгүй");
    if (inv.status !== "paid")
      throw new BadRequestException("Зөвхөн бүрэн төлөгдсөн нэхэмжлэлд И-Баримт гаргана.");

    /* Мөр тус бүрийн дүнг НӨАТ-ыг ОРУУЛСАН байдлаар (хөнгөлөлтийг хувь
       тэнцүүлэн хасаж) бодно — нийлбэр нь нэхэмжлэлийн total-тай яг таарна. */
    const vatRate = inv.vatRate ?? 0;
    const taxType = vatRate > 0 ? "VAT_ABLE" : "VAT_FREE";
    const subtotal = inv.subtotal || 1;

    let sumAmount = 0;
    let sumVat = 0;
    const items = inv.items.map((it) => {
      const share = it.total / subtotal;
      const taxable = it.total - inv.discount * share;
      const vat = vatRate > 0 ? Math.round(taxable * (vatRate / 100)) : 0;
      const amount = Math.round(taxable) + vat;
      sumAmount += amount;
      sumVat += vat;
      return {
        name: it.name,
        barCode: "",
        barCodeType: "UNDEFINED",
        classificationCode: cfg.classificationCode || "",
        measureUnit: "ш",
        qty: it.quantity,
        unitPrice: it.quantity > 0 ? Math.round((amount / it.quantity) * 100) / 100 : amount,
        totalBonus: 0,
        totalVAT: vat,
        totalCityTax: 0,
        totalAmount: amount,
      };
    });
    // Бөөрөнхийлөлтийн зөрүүг сүүлийн мөрөнд шингээж нийлбэрийг нэхэмжлэлтэй тэнцүүлнэ
    if (items.length > 0) {
      const last = items[items.length - 1];
      last.totalAmount += inv.total - sumAmount;
      last.totalVAT += (inv.vat ?? 0) - sumVat;
    }

    // Төлбөрийн хэлбэрүүд — PosAPI зөвхөн CASH / PAYMENT_CARD дэмжинэ
    const cardPaid = inv.payments
      .filter((p) => p.method === "card")
      .reduce((s, p) => s + p.amount, 0);
    const otherPaid = inv.total - cardPaid;
    const payments: any[] = [];
    if (otherPaid > 0) payments.push({ code: "CASH", status: "PAID", paidAmount: otherPaid });
    if (cardPaid > 0) payments.push({ code: "PAYMENT_CARD", status: "PAID", paidAmount: cardPaid });

    const payload = {
      totalAmount: inv.total,
      totalVAT: inv.vat ?? 0,
      totalCityTax: 0,
      districtCode: cfg.districtCode,
      merchantTin: cfg.merchantTin,
      posNo: cfg.posNo,
      type: "B2C_RECEIPT",
      receipts: [
        {
          totalAmount: inv.total,
          totalVAT: inv.vat ?? 0,
          totalCityTax: 0,
          taxType,
          merchantTin: cfg.merchantTin,
          items,
        },
      ],
      payments,
    };

    const base = cfg.posApiUrl.replace(/\/+$/, "");
    const res = await posApiFetch(`${base}/rest/receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res?.id)
      throw new BadRequestException(`PosAPI баримт үүсгэсэнгүй: ${res?.message ?? "хариу хоосон"}`);

    const doc = await this.receiptModel.create({
      invoiceId: new Types.ObjectId(invoiceId),
      invoiceNumber: inv.invoiceNumber,
      ebarimtId: res.id,
      lottery: res.lottery,
      qrData: res.qrData,
      totalAmount: inv.total,
      totalVAT: inv.vat ?? 0,
      type: "B2C_RECEIPT",
      date: res.date ?? new Date().toISOString(),
      status: res.status ?? "SUCCESS",
      createdBy: actor.id,
    });

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "ebarimt.create", resource: "ebarimt_receipt", resourceId: doc._id.toString(),
      meta: { invoiceNumber: inv.invoiceNumber, ebarimtId: res.id, total: inv.total },
    });

    return this.receiptToShared(doc);
  }

  /** И-Баримт цуцлах (PosAPI DELETE /rest/receipt) — зөвхөн admin */
  async deleteReceipt(invoiceId: string, actor: AuthUser): Promise<void> {
    const doc = await this.receiptModel
      .findOne({ invoiceId: new Types.ObjectId(invoiceId) })
      .exec();
    if (!doc) throw new NotFoundException("И-Баримт олдсонгүй");

    const cfg = await this.getConfig();
    const base = cfg.posApiUrl.replace(/\/+$/, "");
    await posApiFetch(`${base}/rest/receipt`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.ebarimtId, date: doc.date }),
    });

    await doc.deleteOne();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "ebarimt.delete", resource: "ebarimt_receipt", resourceId: doc._id.toString(),
      meta: { ebarimtId: doc.ebarimtId, invoiceNumber: doc.invoiceNumber },
    });
  }
}
