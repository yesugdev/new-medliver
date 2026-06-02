import type { PrintConfig } from "@his/shared";

export const DEFAULT_PRINT_CONFIG: Omit<PrintConfig, "id" | "updatedAt"> = {
  orgName:         "MEDLIVER",
  showLogo:        false,
  showStamp:       false,
  headerBgColor:   "#1e293b",
  headerTextColor: "#ffffff",
  fontSize:        13,
  pageSize:        "A4",
  pageOrientation: "portrait",
};

function cfg(config?: Partial<PrintConfig>) {
  return { ...DEFAULT_PRINT_CONFIG, ...config };
}

/** Build the <style> + header block */
function buildHead(c: ReturnType<typeof cfg>, subtitle: string): string {
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
      .p-stamp-img{ position:fixed; bottom:1cm; right:1cm; width:90px; height:90px; object-fit:contain; opacity:0.75; }
    </style>
    <div class="p-header">
      ${logoHtml}
      <div style="font-size:${c.fontSize + 8}px;font-weight:bold;letter-spacing:2px">${c.orgName}</div>
      <div style="font-size:${c.fontSize - 1}px;opacity:.8;margin-top:4px">${subtitle}</div>
      ${infoLines}
    </div>
  `;
}

function buildFooter(c: ReturnType<typeof cfg>): string {
  const stampHtml =
    c.showStamp && c.stampUrl
      ? `<img src="${c.stampUrl}" class="p-stamp-img" alt="тамга" />`
      : "";

  return `
    ${stampHtml}
    <div class="p-footer">
      <span>Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}</span>
      ${c.footerNote ? `<span style="text-align:center;flex:1;padding:0 12px">${c.footerNote}</span>` : ""}
      <span class="p-badge">${c.orgName}</span>
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
