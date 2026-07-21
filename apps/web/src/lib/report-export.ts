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
 * хуулж хэвлэнэ. Апп-ийн бүх stylesheet-ийг хамт хуулж авдаг тул хэвлэлт
 * дэлгэц дээрхтэй яг адил цэвэрхэн харагдана. `data-noprint` тэмдэгтэй
 * элементүүдийг хасна.
 */
export function printReport(container: HTMLElement, title: string) {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-noprint]").forEach((el) => el.remove());

  // Апп-ийн CSS (Tailwind + globals)-ийг хуулж авах — эс тэгвэл шинэ цонхонд
  // ямар ч загваргүй, муухай харагдана.
  const headStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((el) => el.outerHTML)
    .join("\n");

  const win = window.open("", "_blank", "width=1120,height=800");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
${headStyles}
<style>
  @page { size: A4 landscape; margin: 12mm; }
  html, body {
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body { margin: 0; padding: 20px; }
  .report-print-title { font-size: 20px; font-weight: 700; margin: 0 0 2px; color: #0f172a; }
  .report-print-date { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  /* Картуудыг хуудас дундуур таслахгүй */
  .report-print-body > div > div,
  .report-print-body [class*="rounded"] { break-inside: avoid; }
  button, [data-noprint] { display: none !important; }
  @media print { body { padding: 0; } }
</style>
</head><body>
  <div class="report-print-title">${esc(title)}</div>
  <div class="report-print-date">Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}</div>
  <div class="report-print-body">${clone.innerHTML}</div>
  <script>
    (function () {
      function waitForStyles() {
        var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
        return Promise.all(links.map(function (l) {
          if (l.sheet) return Promise.resolve();
          return new Promise(function (res) {
            l.addEventListener('load', res);
            l.addEventListener('error', res);
            setTimeout(res, 1500);
          });
        }));
      }
      window.onafterprint = function () { window.close(); };
      window.onload = function () {
        waitForStyles().then(function () { setTimeout(function () { window.print(); }, 200); });
      };
    })();
  <\/script>
</body></html>`);
  win.document.close();
}
