import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PrintConfigEntity, PrintConfigSchema } from "./print-config.schema";
import { PrintConfigService } from "./print-config.service";
import { PrintConfigController } from "./print-config.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrintConfigEntity.name, schema: PrintConfigSchema },
    ]),
  ],
  controllers: [PrintConfigController],
  providers:   [PrintConfigService],
  exports:     [PrintConfigService],
})
export class PrintConfigModule {}
