import {
  LAB_CATEGORY_LABELS_MN,
  type LabCategory,
  type LabTest,
  type PrintConfig,
} from "@his/shared";
import { cfg } from "./print-utils";

const REQ_CATEGORY_ORDER: LabCategory[] = [
  "biochemistry", "hematology", "immunology", "hormones",
  "urinalysis", "microbiology", "viral_load", "coagulogram", "rapid_tests", "other",
];

const pad = (n: number) => String(n).padStart(2, "0");

export interface ReqOrder {
  patientName: string;
  doctorName: string;
  labName?: string;
  orderedAt: string;
  items: { testId: string; testName: string; testGroup?: string }[];
}
export interface ReqPatient {
  lastName: string;
  firstName: string;
  registerNumber: string;
}

/** Шинжилгээний бичиг (requisition) — зөвхөн захиалсан тестүүд, төрлөөр бүлэглэн хэвлэнэ */
export function printRequisition(
  order: ReqOrder,
  patient: ReqPatient | undefined,
  catalog: LabTest[],
  config?: Partial<PrintConfig>,
) {
  type Block = { title: string; rows: string[] };
  const catById = new Map<string, LabCategory>();
  for (const t of catalog) catById.set(t.id, t.category);
  const chk = (n: string) => `<div class="chk"><span class="on">☑</span> ${n}</div>`;

  const byCat = new Map<LabCategory, string[]>();
  const byGroup = new Map<string, string[]>();
  for (const it of order.items) {
    const cat = catById.get(it.testId);
    if (cat) {
      const arr = byCat.get(cat) ?? []; arr.push(it.testName); byCat.set(cat, arr);
    } else {
      const g = it.testGroup?.trim() || "Шинжилгээ";
      const arr = byGroup.get(g) ?? []; arr.push(it.testName); byGroup.set(g, arr);
    }
  }

  const blocks: Block[] = [];
  for (const c of REQ_CATEGORY_ORDER) {
    const names = byCat.get(c);
    if (names?.length) blocks.push({ title: LAB_CATEGORY_LABELS_MN[c], rows: names.map(chk) });
  }
  for (const [g, names] of byGroup) blocks.push({ title: g, rows: names.map(chk) });

  const ncols = Math.min(3, Math.max(1, blocks.length));
  const cols: Block[][] = Array.from({ length: ncols }, () => []);
  blocks.forEach((b, i) => cols[i % ncols].push(b));
  const colHtml = cols.map((col) =>
    `<div class="req-col">${col.map((b) =>
      `<div class="cat"><div class="cat-h">${b.title}</div>${b.rows.join("")}</div>`).join("")}</div>`,
  ).join("");

  const name = patient ? `${patient.lastName} ${patient.firstName}` : order.patientName;
  const rd = patient?.registerNumber ?? "";
  const lab = order.labName ?? "";
  const d = new Date(order.orderedAt);
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const c = cfg(config);
  const infoLines = [
    c.orgAddress, c.orgSubtitle,
    c.orgPhone ? `Утас: ${c.orgPhone}` : "",
    c.orgEmail,
  ].filter(Boolean).map((x) => `<div>${x}</div>`).join("");

  const logoBlock = c.logoUrl
    ? `<img class="rq-logo" src="${c.logoUrl}" alt="logo" />`
    : `<div class="rq-org">${c.orgName}</div>`;

  const win = window.open("", "_blank", "width=980,height=760");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="mn"><head><meta charset="UTF-8" />
  <title>Шинжилгээний бичиг</title>
  <style>
    @page { margin:1.1cm; size:${c.pageSize} ${c.pageOrientation}; }
    *{ box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
    body{ font-family:Arial,sans-serif; color:#1e293b; font-size:${c.fontSize}px; }
    .rq-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .rq-logo{ height:42px; object-fit:contain; }
    .rq-org{ font-size:20px; font-weight:800; letter-spacing:1px; color:${c.headerBgColor}; }
    .rq-info{ font-size:10px; line-height:1.3; text-align:right; color:#475569; font-style:italic; }
    .rq-title{ background:${c.headerBgColor}; color:${c.headerTextColor}; text-align:center; font-weight:800; letter-spacing:3px; padding:5px; font-size:15px; margin:6px 0 10px; }
    .req-info{ display:flex; justify-content:space-between; margin-bottom:12px; font-size:13px; }
    .req-info b{ font-weight:600; }
    .req-grid{ display:flex; gap:14px; align-items:flex-start; }
    .req-col{ flex:1; min-width:0; }
    .cat{ margin-bottom:8px; }
    .cat-h{ background:#dbeafe; font-weight:700; font-size:12px; padding:3px 6px; border:1px solid #bfdbfe; }
    .chk{ font-size:11.5px; padding:2px 6px; border-bottom:1px solid #eef2f7; }
    .chk .on{ color:#16a34a; font-weight:700; }
    .req-sign{ display:flex; justify-content:space-between; margin-top:18px; font-size:13px; }
  </style></head><body>
    <div class="rq-head">
      <div>${logoBlock}</div>
      <div class="rq-info">${infoLines}</div>
    </div>
    <div class="rq-title">ШИНЖИЛГЭЭНИЙ БИЧИГ</div>
    <div class="req-info">
      <div>Нэр: <b>${name}</b> &nbsp;&nbsp; РД: <b style="font-family:monospace">${rd}</b></div>
      <div>Захиалсан: <b>${dateStr}</b></div>
    </div>
    <div class="req-grid">${colHtml}</div>
    <div class="req-sign">
      <div>Эмнэлэг: <b>${lab || "____________________"}</b></div>
      <div>Эмч: <b>${order.doctorName}</b></div>
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
  </body></html>`);
  win.document.close();
}
