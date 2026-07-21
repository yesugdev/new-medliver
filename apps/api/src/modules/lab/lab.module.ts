import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LabTest, LabTestSchema } from "./lab-test.schema";
import { LabOrder, LabOrderSchema } from "./lab-order.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { User, UserSchema } from "../users/user.schema";
import { LabCategoriesModule } from "../lab-categories/lab-categories.module";
import { LabService } from "./lab.service";
import { LabTestsController, LabOrdersController } from "./lab.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LabTest.name,  schema: LabTestSchema },
      { name: LabOrder.name, schema: LabOrderSchema },
      { name: Patient.name,  schema: PatientSchema },
      { name: User.name,     schema: UserSchema },
    ]),
    LabCategoriesModule,
  ],
  controllers: [LabTestsController, LabOrdersController],
  providers:   [LabService],
  exports:     [LabService],
})
export class LabModule {}
