/* ─── Reports module shared types ───────────────────────────────────── */

import type { Role } from "./roles";

/** Тайлан модулийг харах эрхтэй role-ууд. Admin үргэлж хандах эрхтэй. */
export interface ReportAccessConfig {
  roles: Role[];
}

export interface UpdateReportAccessInput {
  roles: Role[];
}

/** Хугацааны шүүлтүүрийн preset */
export type ReportPeriod = "day" | "week" | "month" | "year" | "custom";

export interface ReportRange {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export interface NameCount {
  name: string;
  count: number;
}
export interface LabelCount {
  label: string;
  count: number;
}
export interface DateCount {
  date: string; // YYYY-MM-DD
  count: number;
}
export interface ReportUserStat {
  userId: string;
  name: string;
  role: string;
  count: number;
}

/* ── 1. Өвчтөний тайлан ───────────────────────────────────────────── */
export interface PatientReport {
  kpi: {
    todayRegistered: number;
    totalPatients: number;
    todayTreatments: number;
    returningPatients: number;
    newPatients: number;
  };
  gender: { male: number; female: number; other: number };
  ageGroups: LabelCount[];
  byUser: ReportUserStat[];
  treatment: {
    total: number;
    topTypes: NameCount[];
    daily: DateCount[];
  };
  dailyRegistrations: DateCount[];
}

/* ── 2. Лабораторийн тайлан ───────────────────────────────────────── */
export interface LaboratoryReport {
  kpi: {
    totalTests: number;
    resulted: number;
    pending: number;
    normal: number;
    abnormal: number;
  };
  byType: LabelCount[];
  status: { resulted: number; pending: number; cancelled: number };
  byUser: ReportUserStat[];
  daily: DateCount[];
  normalAbnormal: { normal: number; abnormal: number };
  topTests: NameCount[];
}

/* ── 3. Санхүүгийн тайлан ─────────────────────────────────────────── */
export interface FinancialUserStat {
  userId: string;
  name: string;
  role: string;
  amount: number;
}

export interface FinancialReport {
  kpi: {
    todayRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    rangeRevenue: number;
    paymentsCount: number;
    avgPayment: number;
  };
  byMethod: { method: string; count: number; amount: number }[];
  dailyRevenue: { date: string; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number }[];
  discount: { total: number; patients: number; avg: number };
  byService: { category: string; count: number; amount: number }[];
  byUser: FinancialUserStat[];
}
