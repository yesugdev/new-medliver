import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { DashboardStats } from "@his/shared";
import { Patient, PatientDocument } from "../patients/patient.schema";
import { AppointmentsService } from "../appointments/appointments.service";
import { EmrService } from "../emr/emr.service";
import { InvoicesService } from "../billing/invoices.service";

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    private readonly appointments: AppointmentsService,
    private readonly emr: EmrService,
    private readonly invoices: InvoicesService,
  ) {}

  async dashboard(): Promise<DashboardStats> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [totalPatients, todayAppt, todayRev, todayVisits, newWeek] = await Promise.all([
      this.patientModel.countDocuments({}),
      this.appointments.countToday(),
      this.invoices.todayRevenue(),
      this.emr.countToday(),
      this.patientModel.countDocuments({ createdAt: { $gte: weekStart } }),
    ]);

    return {
      totalPatients,
      todayAppointments: todayAppt.total,
      waitingPatients: todayAppt.waiting,
      todayRevenue: todayRev.paid,
      todayVisits,
      newPatientsThisWeek: newWeek,
    };
  }
}
