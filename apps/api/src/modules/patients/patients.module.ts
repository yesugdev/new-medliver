import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Patient, PatientSchema } from "./patient.schema";
import { MedicalHistory, MedicalHistorySchema } from "./medical-history.schema";
import { PatientsService } from "./patients.service";
import { MedicalHistoryService } from "./medical-history.service";
import { PatientsController } from "./patients.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name,        schema: PatientSchema        },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, MedicalHistoryService],
  exports: [PatientsService, MedicalHistoryService],
})
export class PatientsModule {}
