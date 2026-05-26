export type ServiceCategory =
  | "consultation"
  | "procedure"
  | "lab"
  | "imaging"
  | "medication"
  | "other";

export const SERVICE_CATEGORY_LABELS_MN: Record<ServiceCategory, string> = {
  consultation: "Үзлэг",
  procedure: "Үйлдэл",
  lab: "Шинжилгээ",
  imaging: "Дүрс оношилгоо",
  medication: "Эм",
  other: "Бусад",
};

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: ServiceCategory;
  price: number;
  isActive: boolean;
}

export interface CreateServiceInput {
  code: string;
  name: string;
  category: ServiceCategory;
  price: number;
}

export type InvoiceStatus = "draft" | "issued" | "partial" | "paid" | "cancelled";

export const INVOICE_STATUS_LABELS_MN: Record<InvoiceStatus, string> = {
  draft: "Ноорог",
  issued: "Гаргасан",
  partial: "Хэсэгчилсэн",
  paid: "Төлсөн",
  cancelled: "Цуцалсан",
};

export type PaymentMethod = "cash" | "card" | "transfer" | "insurance";

export const PAYMENT_METHOD_LABELS_MN: Record<PaymentMethod, string> = {
  cash: "Бэлэн",
  card: "Карт",
  transfer: "Шилжүүлэг",
  insurance: "Даатгал",
};

export interface InvoiceLineItem {
  serviceId?: string;
  code?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentEntry {
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receivedBy?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  visitId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
  payments: PaymentEntry[];
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  patientId: string;
  visitId?: string;
  items: Array<{ serviceId?: string; name: string; quantity: number; unitPrice: number }>;
  discount?: number;
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  note?: string;
}
