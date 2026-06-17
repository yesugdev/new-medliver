import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PatientDiagnosis, PatientDiagnosisSchema } from "./diagnosis.schema";
import { ClinicalScore, ClinicalScoreSchema } from "./clinical-score.schema";
import { DiagnosesService } from "./diagnoses.service";
import { DiagnosesController } from "./diagnoses.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientDiagnosis.name, schema: PatientDiagnosisSchema },
      { name: ClinicalScore.name,    schema: ClinicalScoreSchema    },
    ]),
  ],
  controllers: [DiagnosesController],
  providers: [DiagnosesService],
})
export class DiagnosesModule {}
