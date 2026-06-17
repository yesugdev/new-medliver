import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TreatmentTaskEntity, TreatmentTaskSchema } from "./treatment-task.schema";
import { TreatmentTaskService } from "./treatment-task.service";
import { TreatmentTaskController } from "./treatment-task.controller";
import { Patient, PatientSchema } from "../patients/patient.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreatmentTaskEntity.name, schema: TreatmentTaskSchema },
      { name: Patient.name,             schema: PatientSchema        },
    ]),
  ],
  controllers: [TreatmentTaskController],
  providers:   [TreatmentTaskService],
  exports:     [TreatmentTaskService],
})
export class TreatmentTaskModule {}
