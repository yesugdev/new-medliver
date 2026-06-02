import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TreatmentTaskEntity, TreatmentTaskSchema } from "./treatment-task.schema";
import { TreatmentTaskService } from "./treatment-task.service";
import { TreatmentTaskController } from "./treatment-task.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreatmentTaskEntity.name, schema: TreatmentTaskSchema },
    ]),
  ],
  controllers: [TreatmentTaskController],
  providers:   [TreatmentTaskService],
  exports:     [TreatmentTaskService],
})
export class TreatmentTaskModule {}
