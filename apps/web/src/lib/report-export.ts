/**
 * Тайлан экспорт — Excel (.xls SpreadsheetML), CSV, Print/PDF.
 * Гуравдагч сангүй: drug-export.ts-тэй адил хандлагаар браузер дээр шууд үүсгэнэ.
 */

export type Cell = string | number;

export interface ExportSheet {
  name: string;
  headers: string[];
  rows: Cell[][];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function xlCell(v: Cell): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${esc(String(v ?? ""))}</Data></Cell>`;
}

function xlSheet(s: ExportSheet): string {
  const header = `<Row>${s.headers.map(xlCell).join("")}</Row>`;
  const body = s.rows.map((r) => `<Row>${r.map(xlCell).join("")}</Row>`).join("");
  // Excel worksheet нэр 31 тэмдэгтээс хэтрэхгүй, зарим тусгай тэмдэгт зөвшөөрөгдөхгүй
  const safeName = s.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
  return `<Worksheet ss:Name="${esc(safeName)}"><Table>${header}${body}</Table></Worksheet>`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportExcel(baseName: string, sheets: ExportSheet[]) {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    sheets.map(xlSheet).join("") +
    `</Workbook>`;
  triggerDownload(
    new Blob(["﻿", xml], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${baseName}-${stamp()}.xls`,
  );
}

const csvCell = (v: Cell) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(baseName: string, sheets: ExportSheet[]) {
  const lines: string[] = [];
  for (const s of sheets) {
    lines.push(`# ${s.name}`);
    lines.push(s.headers.map(csvCell).join(","));
    for (const r of s.rows) lines.push(r.map(csvCell).join(","));
    lines.push("");
  }
  triggerDownload(
    new Blob(["﻿", lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    `${baseName}-${stamp()}.csv`,
  );
}

/**
 * Print / PDF — тухайн DOM хэсгийг (SVG график + хүснэгт) шинэ цонхонд
 * хуулж хэвлэнэ. `data-noprint` тэмдэгтэй элементүүдийг хасна.
 */
export function printReport(container: HTMLElement, title: string) {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-noprint]").forEach((el) => el.remove());

  const win = window.open("", "_blank", "width=1000,height=760");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<style>
  @page { margin: 1.2cm; size: A4 landscape; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .print-date { color: #64748b; font-size: 11px; margin-bottom: 14px; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 14px; break-inside: avoid; }
  .card > div:first-child { font-weight: 700; font-size: 12px; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
  .card > div:last-child { padding: 12px 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #eef2f7; font-size: 11px; }
  th { color: #64748b; }
  svg { max-width: 100%; height: auto; }
  .grid { display: grid; gap: 12px; }
  button { display: none !important; }
</style>
</head><body>
  <h1>${esc(title)}</h1>
  <div class="print-date">Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}</div>
  ${clone.innerHTML}
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
</body></html>`);
  win.document.close();
}
