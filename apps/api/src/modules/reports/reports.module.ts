import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { Treatment, TreatmentSchema } from "../patients/treatment.schema";
import { LabOrder, LabOrderSchema } from "../lab/lab-order.schema";
import { Invoice, InvoiceSchema } from "../billing/invoice.schema";
import { User, UserSchema } from "../users/user.schema";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name,   schema: PatientSchema },
      { name: Treatment.name, schema: TreatmentSchema },
      { name: LabOrder.name,  schema: LabOrderSchema },
      { name: Invoice.name,   schema: InvoiceSchema },
      { name: User.name,      schema: UserSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers:   [ReportsService],
})
export class ReportsModule {}
