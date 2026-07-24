import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { DashboardStats } from "@his/shared";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { AppointmentsService } from "../appointments/appointments.service";
import { EmrService } from "../emr/emr.service";
import { InvoicesService } from "../billing/invoices.service";
import { DrugsService } from "../drugs/drugs.service";
import { TreatmentTaskService } from "../treatment-tasks/treatment-task.service";
import { LabService } from "../lab/lab.service";

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    private readonly appointments: AppointmentsService,
    private readonly emr: EmrService,
    private readonly invoices: InvoicesService,
    private readonly drugs: DrugsService,
    private readonly treatmentTasks: TreatmentTaskService,
    private readonly lab: LabService,
  ) {}

  async dashboard(): Promise<DashboardStats> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalPatients, todayAppt, todayRev, todayVisits, newWeek,
      totalRev, todayTreat, drugReport, todayLabOrders, pendingLabResults,
    ] = await Promise.all([
      this.patientModel.countDocuments({}),
      this.appointments.countToday(),
      this.invoices.todayRevenue(),
      this.emr.countToday(),
      this.patientModel.countDocuments({ createdAt: { $gte: weekStart } }),
      this.invoices.totalRevenue(),
      this.treatmentTasks.countToday(),
      this.drugs.reports(),
      this.lab.countTodayOrders(),
      this.lab.countPendingResults(),
    ]);

    return {
      totalPatients,
      todayAppointments: todayAppt.total,
      waitingPatients: todayAppt.waiting,
      todayRevenue: todayRev.paid,
      todayVisits,
      newPatientsThisWeek: newWeek,
      totalRevenue: totalRev,
      todayTreatments: todayTreat,
      drugValuation: drugReport.totalValuation,
      drugLowStock: drugReport.lowStock.length,
      drugExpiring: drugReport.expiringSoon.length + drugReport.expired.length,
      todayLabOrders,
      pendingLabResults,
    };
  }
}
