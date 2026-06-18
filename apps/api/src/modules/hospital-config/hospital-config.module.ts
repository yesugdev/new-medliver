import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HospitalConfigEntity, HospitalConfigSchema } from "./hospital-config.schema";
import { HospitalConfigService } from "./hospital-config.service";
import { HospitalConfigController } from "./hospital-config.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HospitalConfigEntity.name, schema: HospitalConfigSchema },
    ]),
  ],
  controllers: [HospitalConfigController],
  providers:   [HospitalConfigService],
  exports:     [HospitalConfigService],
})
export class HospitalConfigModule {}
