import type { PrintConfig } from "@his/shared";

export const DEFAULT_PRINT_CONFIG: Omit<PrintConfig, "id" | "updatedAt"> = {
  orgName:              "MEDLIVER",
  showLogo:             false,
  showStamp:            false,
  headerBgColor:        "#1e293b",
  headerTextColor:      "#ffffff",
  fontSize:             13,
  pageSize:             "A4",
  pageOrientation:      "portrait",
  showPatientCode:      true,
  showPatientRegister:  true,
  showPatientAge:       true,
  showPatientGender:    true,
  showPatientPhone:     true,
  showPatientAddress:   false,
  showPatientBloodType: false,
  showPatientBirthDate: false,
  showPatientDoctor:    false,
};

/** Patient info passed to print functions */
export interface PrintPatientInfo {
  name: string;
  patientCode?: string;
  registerNumber?: string;
  birthDate?: string;     // ISO string
  gender?: string;        // "male" | "female" | "other"
  phone?: string;
  address?: string;
  bloodType?: string;
  attendingDoctorName?: string;
}

const GENDER_MN: Record<string, string> = {
  male: "Эрэгтэй", female: "Эмэгтэй", other: "Бусад",
};

function calcAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Build a patient info block HTML for print documents */
export function buildPatientMeta(
  patient: PrintPatientInfo,
  config: CfgType,
): string {
  const rows: string[] = [];
  const cell = (label: string, value: string, mono = false) =>
    `<div class="p-meta-block"><span>${label}</span><strong${mono ? ' style="font-family:monospace"' : ""}>${value}</strong></div>`;

  // Name always shown
  rows.push(cell("Өвчтөн", patient.name));
  if (config.showPatientCode && patient.patientCode)
    rows.push(cell("Өвчтөний код", patient.patientCode, true));
  if (config.showPatientRegister && patient.registerNumber)
    rows.push(cell("Регистр", patient.registerNumber, true));
  if (config.showPatientBirthDate && patient.birthDate)
    rows.push(cell("Төрсөн огноо", new Date(patient.birthDate).toLocaleDateString("mn-MN")));
  if (config.showPatientAge) {
    const age = calcAge(patient.birthDate);
    if (age !== null) rows.push(cell("Нас", `${age} нас`));
  }
  if (config.showPatientGender && patient.gender)
    rows.push(cell("Хүйс", GENDER_MN[patient.gender] ?? patient.gender));
  if (config.showPatientPhone && patient.phone)
    rows.push(cell("Утас", patient.phone, true));
  if (config.showPatientAddress && patient.address)
    rows.push(cell("Хаяг", patient.address));
  if (config.showPatientBloodType && patient.bloodType)
    rows.push(cell("Цусны бүлэг", patient.bloodType));
  if (config.showPatientDoctor && patient.attendingDoctorName)
    rows.push(cell("Хяналтын эмч", patient.attendingDoctorName));

  return `<div class="p-meta">${rows.join("")}</div>`;
}

export function cfg(config?: Partial<PrintConfig>) {
  return { ...DEFAULT_PRINT_CONFIG, ...config };
}

type CfgType = ReturnType<typeof cfg>;

/** Build the <style> + header block */
function buildHead(c: CfgType, subtitle: string): string {
  const logoHtml =
    c.showLogo && c.logoUrl
      ? `<img src="${c.logoUrl}" style="height:52px;object-fit:contain;margin-bottom:6px;display:block;margin-left:auto;margin-right:auto" />`
      : "";

  const infoLines = [
    c.orgSubtitle ? `<div style="font-size:11px;opacity:.85;margin-top:2px">${c.orgSubtitle}</div>` : "",
    c.orgAddress  ? `<div style="font-size:11px;opacity:.75;margin-top:1px">${c.orgAddress}</div>` : "",
    c.orgPhone    ? `<div style="font-size:11px;opacity:.75">Утас: ${c.orgPhone}</div>` : "",
    c.orgEmail    ? `<div style="font-size:11px;opacity:.75">${c.orgEmail}</div>` : "",
  ].filter(Boolean).join("");

  return `
    <style>
      @page { margin:1.5cm; size:${c.pageSize} ${c.pageOrientation}; }
      *{
        box-sizing:border-box; margin:0; padding:0;
        -webkit-print-color-adjust:exact !important;
        print-color-adjust:exact !important;
        color-adjust:exact !important;
      }
      body{ font-family:Arial,sans-serif; font-size:${c.fontSize}px; color:#1e293b; background:#fff; }
      table{ width:100%; border-collapse:collapse; }
      th{
        background:${c.headerBgColor} !important;
        color:${c.headerTextColor} !important;
        padding:8px 12px; text-align:left;
        font-size:${c.fontSize - 2}px; white-space:nowrap;
      }
      .p-header{
        text-align:center;
        background:${c.headerBgColor} !important;
        color:${c.headerTextColor} !important;
        padding:14px 16px; margin-bottom:18px; border-radius:4px;
      }
      .p-meta{ display:flex; justify-content:space-between; margin-bottom:16px; font-size:${c.fontSize - 1}px; flex-wrap:wrap; gap:8px; }
      .p-meta-block span{ color:#64748b; font-size:${c.fontSize - 2}px; }
      .p-meta-block strong{ display:block; margin-top:2px; }
      .p-footer{ margin-top:24px; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #ddd; padding-top:10px; font-size:${c.fontSize - 2}px; color:#64748b; }
      .p-badge{ border:2px solid ${c.headerBgColor}; color:${c.headerBgColor}; padding:3px 14px; border-radius:4px; font-weight:bold; font-size:${c.fontSize - 1}px; letter-spacing:1px; }
    </style>
    <div class="p-header">
      ${logoHtml}
      <div style="font-size:${c.fontSize + 8}px;font-weight:bold;letter-spacing:2px">${c.orgName}</div>
      <div style="font-size:${c.fontSize - 1}px;opacity:.8;margin-top:4px">${subtitle}</div>
      ${infoLines}
    </div>
  `;
}

function buildFooter(c: CfgType): string {
  const rightCorner =
    c.showStamp && c.stampUrl
      ? `<img src="${c.stampUrl}" style="height:72px;width:72px;object-fit:contain;opacity:0.8" alt="тамга" />`
      : `<span class="p-badge">${c.orgName}</span>`;

  return `
    <div class="p-footer">
      <span>Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}</span>
      ${c.footerNote ? `<span style="text-align:center;flex:1;padding:0 12px">${c.footerNote}</span>` : ""}
      ${rightCorner}
    </div>
  `;
}

/** Open a popup print window */
export function openPrintWindow(
  title: string,
  subtitle: string,
  bodyHtml: string,
  config?: Partial<PrintConfig>,
) {
  const c = cfg(config);
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="mn"><head>
<meta charset="UTF-8"/>
<title>${title}</title>
${buildHead(c, subtitle)}
</head><body>
${bodyHtml}
${buildFooter(c)}
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
</body></html>`);
  win.document.close();
}
