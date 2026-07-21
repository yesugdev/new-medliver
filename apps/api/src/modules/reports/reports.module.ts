import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { Treatment, TreatmentSchema } from "../patients/treatment.schema";
import { LabOrder, LabOrderSchema } from "../lab/lab-order.schema";
import { Invoice, InvoiceSchema } from "../billing/invoice.schema";
import { User, UserSchema } from "../users/user.schema";
import { ReportAccessEntity, ReportAccessSchema } from "./report-access.schema";
import { ReportsService } from "./reports.service";
import { ReportAccessService } from "./report-access.service";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name,           schema: PatientSchema },
      { name: Treatment.name,         schema: TreatmentSchema },
      { name: LabOrder.name,          schema: LabOrderSchema },
      { name: Invoice.name,           schema: InvoiceSchema },
      { name: User.name,              schema: UserSchema },
      { name: ReportAccessEntity.name, schema: ReportAccessSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers:   [ReportsService, ReportAccessService],
})
export class ReportsModule {}
