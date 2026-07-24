export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTION: "reception",
  LAB: "lab",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS_MN: Record<Role, string> = {
  admin: "Админ",
  manager: "Менежер",
  doctor: "Эмч",
  nurse: "Сувилагч",
  reception: "Регистратор",
  lab: "Лаборант",
};

export const ALL_ROLES: Role[] = Object.values(ROLES);
