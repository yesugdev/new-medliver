import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Patient, PatientSchema } from "./patient.schema";
import { MedicalHistory, MedicalHistorySchema } from "./medical-history.schema";
import { Treatment, TreatmentSchema } from "./treatment.schema";
import { PatientsService } from "./patients.service";
import { MedicalHistoryService } from "./medical-history.service";
import { TreatmentService } from "./treatment.service";
import { PatientsController } from "./patients.controller";
import { DrugsModule } from "../drugs/drugs.module";
import { TreatmentTaskModule } from "../treatment-tasks/treatment-task.module";
import { BillingModule } from "../billing/billing.module";
import { HospitalConfigModule } from "../hospital-config/hospital-config.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name,        schema: PatientSchema        },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
      { name: Treatment.name,      schema: TreatmentSchema      },
    ]),
    DrugsModule,
    TreatmentTaskModule,
    BillingModule,
    HospitalConfigModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, MedicalHistoryService, TreatmentService],
  exports: [PatientsService, MedicalHistoryService, TreatmentService],
})
export class PatientsModule {}
