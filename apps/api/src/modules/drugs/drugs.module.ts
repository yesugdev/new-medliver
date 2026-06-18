import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrugEntity, DrugSchema } from "./drug.schema";
import { DrugBatchEntity, DrugBatchSchema } from "./drug-batch.schema";
import { StockMovementEntity, StockMovementSchema } from "./stock-movement.schema";
import { DrugsService } from "./drugs.service";
import { DrugsController } from "./drugs.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DrugEntity.name,          schema: DrugSchema },
      { name: DrugBatchEntity.name,     schema: DrugBatchSchema },
      { name: StockMovementEntity.name, schema: StockMovementSchema },
    ]),
  ],
  controllers: [DrugsController],
  providers:   [DrugsService],
  exports:     [DrugsService],
})
export class DrugsModule {}
