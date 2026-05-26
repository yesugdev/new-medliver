import type { AppointmentStatus, InvoiceStatus, LabInterpretation, LabOrderStatus, VisitStatus } from "@his/shared";
import type { BadgeTone } from "@/components/ui/badge";

export const APPOINTMENT_TONE: Record<AppointmentStatus, BadgeTone> = {
  scheduled: "info",
  waiting: "warning",
  in_progress: "primary",
  completed: "success",
  cancelled: "muted",
  no_show: "destructive",
};

export const VISIT_TONE: Record<VisitStatus, BadgeTone> = {
  in_progress: "primary",
  completed: "success",
};

export const LAB_ORDER_TONE: Record<LabOrderStatus, BadgeTone> = {
  ordered:   "info",
  partial:   "warning",
  completed: "success",
  cancelled: "muted",
};

export const LAB_INTERP_TONE: Record<LabInterpretation, BadgeTone> = {
  normal:        "success",
  low:           "warning",
  high:          "warning",
  critical_low:  "destructive",
  critical_high: "destructive",
  abnormal:      "destructive",
};

export const INVOICE_TONE: Record<InvoiceStatus, BadgeTone> = {
  draft: "muted",
  issued: "info",
  partial: "warning",
  paid: "success",
  cancelled: "destructive",
};
