import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LabCategoryEntity, LabCategorySchema } from "./lab-category.schema";
import { LabTest, LabTestSchema } from "../lab/lab-test.schema";
import { LabCategoriesService } from "./lab-categories.service";
import { LabCategoriesController } from "./lab-categories.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LabCategoryEntity.name, schema: LabCategorySchema },
      { name: LabTest.name,           schema: LabTestSchema },
    ]),
  ],
  controllers: [LabCategoriesController],
  providers:   [LabCategoriesService],
  exports:     [LabCategoriesService],
})
export class LabCategoriesModule {}
