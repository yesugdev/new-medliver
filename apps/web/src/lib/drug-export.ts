import type { DrugExport } from "@his/shared";

/**
 * Эм + цувралыг 2 хуудастай Excel (SpreadsheetML 2003) болгон татах.
 * Гадны сан ашиглахгүй — браузер дээр шууд үүсгэнэ.
 */

type Cell = string | number;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function cell(v: Cell): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${esc(String(v ?? ""))}</Data></Cell>`;
}

function sheet(name: string, headers: string[], rows: Cell[][]): string {
  const headerRow = `<Row>${headers.map((h) => cell(h)).join("")}</Row>`;
  const bodyRows = rows.map((r) => `<Row>${r.map((c) => cell(c)).join("")}</Row>`).join("");
  return `<Worksheet ss:Name="${esc(name)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>`;
}

const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export function downloadDrugExcel(data: DrugExport) {
  const drugHeaders = [
    "Код", "Нэр", "Хэлбэр", "Тун", "Нэгж", "Ангилал", "Үйлдвэрлэгч",
    "Нийт нөөц", "Анхааруулах доод хэмжээ", "Зарах үнэ", "Идэвхтэй",
  ];
  const drugRows: Cell[][] = data.drugs.map((d) => [
    d.code ?? "", d.name, d.form, d.dosage, d.unit, d.category ?? "", d.manufacturer ?? "",
    d.stock, d.minStock, d.salePrice, d.isActive ? "Тийм" : "Үгүй",
  ]);

  const batchHeaders = [
    "Эм", "Цувралын дугаар", "Дуусах хугацаа", "Үлдэгдэл", "Анхны тоо",
    "Өртөг", "Зарах үнэ", "Нийлүүлэгч", "Орлогын огноо",
  ];
  const batchRows: Cell[][] = data.batches.map((b) => [
    b.drugName ?? "", b.batchNumber, day(b.expiryDate), b.quantity, b.initialQuantity,
    b.costPrice, b.salePrice, b.supplier ?? "", day(b.receivedAt),
  ]);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    sheet("Эм", drugHeaders, drugRows) +
    sheet("Цуврал", batchHeaders, batchRows) +
    `</Workbook>`;

  const blob = new Blob(["﻿", xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `drug-inventory-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
