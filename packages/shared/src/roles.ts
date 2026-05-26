export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTION: "reception",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS_MN: Record<Role, string> = {
  admin: "Админ",
  manager: "Менежер",
  doctor: "Эмч",
  nurse: "Сувилагч",
  reception: "Регистратор",
};

export const ALL_ROLES: Role[] = Object.values(ROLES);
