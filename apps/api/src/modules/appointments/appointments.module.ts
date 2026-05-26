import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Appointment, AppointmentSchema } from "./appointment.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { User, UserSchema } from "../users/user.schema";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsController } from "./appointments.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
