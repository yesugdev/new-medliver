import type { Invoice, PrintConfig, PaymentMethod } from "@his/shared";
import { PAYMENT_METHOD_LABELS_MN } from "@his/shared";
import { formatMnt } from "./format";
import { formatDateTimeMn } from "./utils";
import type { PrintPatientInfo } from "./print-utils";

/**
 * Thermal receipt printing (58мм / 76мм / 80мм Xprinter-класс принтерүүд).
 *
 * A4 хэвлэлтээс (print-utils.ts) ялгаатай:
 *  - @page хэмжээ нь цаасны бодит өргөнтэй яг таарна (margin:0, height:auto —
 *    тасалбарын урт нь агуулгаас хамаарч rolls дээр автоматаар сунадаг).
 *  - Багана бүрийг px-ээр биш, уян хатан flex/ch нэгжээр байрлуулдаг тул
 *    58мм-ийн нарийн өргөнд ч давхцал/тасрал үүсэхгүй.
 *  - Барааны нэрийг тусдаа мөрөнд, тоо x үнэ = дүнг дараагийн мөрөнд харуулдаг
 *    тул урт нэр баганын зэрэгцүүлэлтийг эвдэхгүйгээр дараагийн мөрөнд шилждэг.
 */

export const THERMAL_WIDTHS = {
  "58": { mm: 57.5, fontSize: 11, titleSize: 14, smallSize: 9,  pad: 1.5 },
  "76": { mm: 76,   fontSize: 12.5, titleSize: 16, smallSize: 10, pad: 2.5 },
  "80": { mm: 79.5, fontSize: 13, titleSize: 17, smallSize: 10.5, pad: 3 },
} as const;

export type ThermalWidthKey = keyof typeof THERMAL_WIDTHS;

export const THERMAL_WIDTH_LABELS: Record<ThermalWidthKey, string> = {
  "58": "58 мм",
  "76": "76 мм",
  "80": "80 мм",
};

/** Open a popup print window sized exactly to the thermal paper width. */
function openThermalPrintWindow(title: string, widthKey: ThermalWidthKey, bodyHtml: string) {
  const w = THERMAL_WIDTHS[widthKey];
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  @page { size: ${w.mm}mm auto; margin: 0; }
  * {
    box-sizing: border-box; margin: 0; padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body { width: ${w.mm}mm; }
  body {
    font-family: "Courier New", Consolas, monospace;
    font-size: ${w.fontSize}px;
    line-height: 1.35;
    color: #000;
    background: #fff;
    padding: 1mm ${w.pad}mm 3mm;
  }
  .t-center { text-align: center; }
  .t-bold   { font-weight: 700; }
  .t-title  { font-size: ${w.titleSize}px; letter-spacing: .5px; }
  .t-small  { font-size: ${w.smallSize}px; }
  .t-divider       { border-top: 1px dashed #000; margin: 3px 0; }
  .t-divider-solid { border-top: 1px solid #000;  margin: 2px 0; }
  .t-row {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 6px; padding: 1px 0;
  }
  .t-row > span:first-child {
    flex: 1 1 auto; min-width: 0;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .t-row > span:last-child {
    flex: 0 0 auto; text-align: right; white-space: nowrap;
  }
  .t-item-name { word-break: break-word; overflow-wrap: anywhere; padding-top: 2px; }
  .t-total     { font-size: ${w.fontSize + 2}px; }
  .mono        { font-family: "Courier New", Consolas, monospace; }
  @media print {
    html, body { width: ${w.mm}mm; }
  }
</style>
</head><body>
${bodyHtml}
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
</body></html>`);
  win.document.close();
}

/** Print a payment invoice as a thermal receipt at the given paper width. */
export function printThermalInvoice(
  inv: Invoice,
  config?: Partial<PrintConfig>,
  patient?: PrintPatientInfo,
  widthKey: ThermalWidthKey = "80",
) {
  const orgName     = config?.orgName || "MEDLIVER";
  const orgSubtitle = config?.orgSubtitle;
  const orgAddress  = config?.orgAddress;
  const orgPhone    = config?.orgPhone;
  const footerNote  = config?.footerNote;

  const itemRows = inv.items.map((it) => `
    <div class="t-item-name">${it.name}</div>
    <div class="t-row">
      <span>${it.quantity} x ${formatMnt(it.unitPrice)}</span>
      <span>${formatMnt(it.total)}</span>
    </div>
  `).join("");

  const lastPayment = inv.payments[inv.payments.length - 1];
  const methodLine = lastPayment
    ? `<div class="t-row"><span>Төлбөрийн хэлбэр</span><span>${PAYMENT_METHOD_LABELS_MN[lastPayment.method as PaymentMethod]}</span></div>`
    : "";

  const body = `
    <div class="t-center t-bold t-title">${orgName}</div>
    ${orgSubtitle ? `<div class="t-center t-small">${orgSubtitle}</div>` : ""}
    ${orgAddress  ? `<div class="t-center t-small">${orgAddress}</div>`  : ""}
    ${orgPhone    ? `<div class="t-center t-small">Утас: ${orgPhone}</div>` : ""}
    <div class="t-divider"></div>
    <div class="t-center t-bold">ТӨЛБӨРИЙН БАРИМТ</div>
    <div class="t-divider"></div>

    <div class="t-row"><span>Баримтын №</span><span class="mono">${inv.invoiceNumber}</span></div>
    <div class="t-row"><span>Огноо</span><span>${formatDateTimeMn(inv.createdAt)}</span></div>
    <div class="t-row"><span>Үйлчлүүлэгч</span><span>${patient?.name ?? inv.patientName}</span></div>
    ${(patient?.patientCode ?? inv.patientCode) ? `<div class="t-row"><span>Код</span><span class="mono">${patient?.patientCode ?? inv.patientCode}</span></div>` : ""}
    ${patient?.registerNumber ? `<div class="t-row"><span>Регистр</span><span class="mono">${patient.registerNumber}</span></div>` : ""}
    <div class="t-divider"></div>

    ${itemRows}
    <div class="t-divider"></div>

    <div class="t-row"><span>Дэд дүн</span><span>${formatMnt(inv.subtotal)}</span></div>
    ${inv.discount > 0 ? `<div class="t-row"><span>Хөнгөлөлт</span><span>−${formatMnt(inv.discount)}</span></div>` : ""}
    ${inv.vat > 0 ? `<div class="t-row"><span>НӨАТ (${inv.vatRate}%)</span><span>${formatMnt(inv.vat)}</span></div>` : ""}
    <div class="t-divider-solid"></div>
    <div class="t-row t-bold t-total"><span>НИЙТ ДҮН</span><span>${formatMnt(inv.total)}</span></div>
    <div class="t-row"><span>Төлсөн</span><span>${formatMnt(inv.paid)}</span></div>
    <div class="t-row t-bold"><span>Үлдэгдэл</span><span>${formatMnt(inv.balance)}</span></div>
    ${methodLine}
    <div class="t-divider"></div>

    <div class="t-center t-small">Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}</div>
    ${footerNote ? `<div class="t-center t-small">${footerNote}</div>` : ""}
    <div class="t-center t-small" style="margin-top:6px">Баярлалаа!</div>
  `;

  openThermalPrintWindow(`Баримт ${inv.invoiceNumber}`, widthKey, body);
}
