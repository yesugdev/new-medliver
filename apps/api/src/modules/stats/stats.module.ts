import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { AppointmentsModule } from "../appointments/appointments.module";
import { EmrModule } from "../emr/emr.module";
import { BillingModule } from "../billing/billing.module";
import { DrugsModule } from "../drugs/drugs.module";
import { TreatmentTaskModule } from "../treatment-tasks/treatment-task.module";
import { StatsService } from "./stats.service";
import { StatsController } from "./stats.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
    AppointmentsModule,
    EmrModule,
    BillingModule,
    DrugsModule,
    TreatmentTaskModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
