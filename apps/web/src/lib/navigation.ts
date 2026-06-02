import {
  Users,
  CalendarClock,
  Stethoscope,
  Receipt,
  LayoutDashboard,
  Shield,
  ClipboardList,
  ListOrdered,
  UserCog,
  HeartPulse,
  FlaskConical,
  FileSliders,
  Pill,
  Printer,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@his/shared";
import { ROLES } from "@his/shared";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Хяналтын самбар",
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION],
  },
  {
    href: "/patients",
    label: "Өвчтөн",
    icon: Users,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION],
  },
  {
    href: "/appointments",
    label: "Цаг захиалга",
    icon: CalendarClock,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTION],
  },
  {
    href: "/queue",
    label: "Дараалал",
    icon: ListOrdered,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION],
  },
  {
    href: "/vitals",
    label: "Амин үзүүлэлт",
    icon: HeartPulse,
    roles: [ROLES.ADMIN, ROLES.NURSE],
  },
  {
    href: "/lab",
    label: "Шинжилгээ",
    icon: FlaskConical,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.MANAGER],
  },
  {
    href: "/emr",
    label: "Үзлэгийн карт",
    icon: Stethoscope,
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE],
  },
  {
    href: "/billing",
    label: "Төлбөр",
    icon: Receipt,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION],
  },
  {
    href: "/drugs",
    label: "Эм бүртгэл",
    icon: Pill,
    roles: [ROLES.ADMIN],
  },
  {
    href: "/users",
    label: "Хэрэглэгчид",
    icon: UserCog,
    roles: [ROLES.ADMIN],
  },
  {
    href: "/audit",
    label: "Аудит лог",
    icon: ClipboardList,
    roles: [ROLES.ADMIN],
  },
  {
    href: "/settings",
    label: "Систем",
    icon: Shield,
    roles: [ROLES.ADMIN],
  },
  {
    href: "/settings/emr-template",
    label: "EMR загвар",
    icon: FileSliders,
    roles: [ROLES.ADMIN],
  },
  {
    href: "/settings/print",
    label: "Хэвлэх загвар",
    icon: Printer,
    roles: [ROLES.ADMIN],
  },
];

export function filterNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
