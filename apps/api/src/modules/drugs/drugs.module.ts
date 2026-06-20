import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrugEntity, DrugSchema } from "./drug.schema";
import { DrugBatchEntity, DrugBatchSchema } from "./drug-batch.schema";
import { StockMovementEntity, StockMovementSchema } from "./stock-movement.schema";
import { DrugOptionEntity, DrugOptionSchema } from "./drug-option.schema";
import { DrugsService } from "./drugs.service";
import { DrugOptionsService } from "./drug-options.service";
import { DrugsController } from "./drugs.controller";
import { DrugOptionsController } from "./drug-options.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DrugEntity.name,          schema: DrugSchema },
      { name: DrugBatchEntity.name,     schema: DrugBatchSchema },
      { name: StockMovementEntity.name, schema: StockMovementSchema },
      { name: DrugOptionEntity.name,    schema: DrugOptionSchema },
    ]),
  ],
  controllers: [DrugsController, DrugOptionsController],
  providers:   [DrugsService, DrugOptionsService],
  exports:     [DrugsService],
})
export class DrugsModule {}
