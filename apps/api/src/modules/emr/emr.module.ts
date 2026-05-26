import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Visit, VisitSchema } from "./visit.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { User, UserSchema } from "../users/user.schema";
import { Appointment, AppointmentSchema } from "../appointments/appointment.schema";
import { EmrService } from "./emr.service";
import { EmrController } from "./emr.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService],
})
export class EmrModule {}
