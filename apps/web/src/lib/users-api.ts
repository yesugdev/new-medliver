import type {
  CreateUserInput,
  SystemUser,
  UpdateUserInput,
  Role,
} from "@his/shared";
import { api } from "./api";

export async function listUsers(params: { role?: Role; search?: string }): Promise<SystemUser[]> {
  const { data } = await api.get<SystemUser[]>("/users", { params });
  return data;
}

export async function listDoctors(): Promise<SystemUser[]> {
  const { data } = await api.get<SystemUser[]>("/users/doctors");
  return data;
}

export async function createUser(payload: CreateUserInput): Promise<SystemUser> {
  const { data } = await api.post<SystemUser>("/users", payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserInput): Promise<SystemUser> {
  const { data } = await api.patch<SystemUser>(`/users/${id}`, payload);
  return data;
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await api.patch(`/users/${id}/password`, { password });
}
