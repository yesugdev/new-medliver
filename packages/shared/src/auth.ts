import type { Role } from "./roles";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: Role;
  phone?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
