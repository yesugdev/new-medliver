export type AppointmentStatus =
  | "scheduled"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export const APPOINTMENT_STATUS_LABELS_MN: Record<AppointmentStatus, string> = {
  scheduled: "Товлогдсон",
  waiting: "Хүлээж буй",
  in_progress: "Үзлэг хийгдэж буй",
  completed: "Дууссан",
  cancelled: "Цуцалсан",
  no_show: "Ирээгүй",
};

export type AppointmentType = "consultation" | "follow_up" | "walk_in" | "emergency" | "treatment";

export const APPOINTMENT_TYPE_LABELS_MN: Record<AppointmentType, string> = {
  consultation: "Анхан үзлэг",
  follow_up: "Давтан үзлэг",
  walk_in: "Чөлөөт цаг",
  emergency: "Яаралтай",
  treatment: "Эмчилгээ",
};

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: string;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  queueNumber?: number;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes?: number;
  type: AppointmentType;
  reason?: string;
  notes?: string;
}

export interface AppointmentListResponse {
  items: Appointment[];
  total: number;
}
