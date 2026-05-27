import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Visit, VisitSchema } from "./visit.schema";
import { EmrTemplate, EmrTemplateSchema } from "./emr-template.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { User, UserSchema } from "../users/user.schema";
import { Appointment, AppointmentSchema } from "../appointments/appointment.schema";
import { EmrService } from "./emr.service";
import { EmrController } from "./emr.controller";
import { EmrTemplateService } from "./emr-template.service";
import { EmrTemplateController } from "./emr-template.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name,        schema: VisitSchema        },
      { name: EmrTemplate.name,  schema: EmrTemplateSchema  },
      { name: Patient.name,      schema: PatientSchema      },
      { name: User.name,         schema: UserSchema         },
      { name: Appointment.name,  schema: AppointmentSchema  },
    ]),
  ],
  controllers: [EmrController, EmrTemplateController],
  providers:   [EmrService,    EmrTemplateService],
  exports:     [EmrService,    EmrTemplateService],
})
export class EmrModule {}
