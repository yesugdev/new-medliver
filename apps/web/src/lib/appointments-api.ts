import type {
  Appointment,
  AppointmentListResponse,
  CreateAppointmentInput,
} from "@his/shared";
import { api } from "./api";

export interface ListAppointmentsParams {
  date?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listAppointments(
  params: ListAppointmentsParams,
): Promise<AppointmentListResponse> {
  const { data } = await api.get<AppointmentListResponse>("/appointments", { params });
  return data;
}

export async function getQueue(doctorId?: string): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments/queue", {
    params: doctorId ? { doctorId } : {},
  });
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(
  payload: CreateAppointmentInput,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

type ApptAction = "check-in" | "start" | "complete" | "cancel" | "no-show";

export async function appointmentAction(
  id: string,
  action: ApptAction,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/${action}`);
  return data;
}

