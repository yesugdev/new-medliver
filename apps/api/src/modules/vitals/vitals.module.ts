import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { VitalsRecord, VitalsRecordSchema } from "./vitals-record.schema";
import { VitalsService } from "./vitals.service";
import { VitalsController } from "./vitals.controller";
import { User, UserSchema } from "../users/user.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VitalsRecord.name, schema: VitalsRecordSchema },
      { name: User.name,        schema: UserSchema },
      { name: Patient.name,     schema: PatientSchema },
    ]),
  ],
  controllers: [VitalsController],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
