import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrugEntity, DrugSchema } from "./drug.schema";
import { DrugsService } from "./drugs.service";
import { DrugsController } from "./drugs.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DrugEntity.name, schema: DrugSchema }]),
  ],
  controllers: [DrugsController],
  providers:   [DrugsService],
  exports:     [DrugsService],
})
export class DrugsModule {}
