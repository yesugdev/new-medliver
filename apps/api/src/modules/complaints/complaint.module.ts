import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ComplaintOption, ComplaintOptionSchema } from "./complaint-option.schema";
import { Complaint, ComplaintSchema } from "./complaint.schema";
import { ComplaintService } from "./complaint.service";
import { ComplaintController } from "./complaint.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ComplaintOption.name, schema: ComplaintOptionSchema },
      { name: Complaint.name,       schema: ComplaintSchema       },
    ]),
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService],
})
export class ComplaintModule {}
