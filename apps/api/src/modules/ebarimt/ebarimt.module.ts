import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EbarimtConfigEntity, EbarimtConfigSchema } from "./ebarimt-config.schema";
import { EbarimtReceiptEntity, EbarimtReceiptSchema } from "./ebarimt-receipt.schema";
import { Invoice, InvoiceSchema } from "../billing/invoice.schema";
import { EbarimtService } from "./ebarimt.service";
import { EbarimtController } from "./ebarimt.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EbarimtConfigEntity.name,  schema: EbarimtConfigSchema },
      { name: EbarimtReceiptEntity.name, schema: EbarimtReceiptSchema },
      { name: Invoice.name,              schema: InvoiceSchema },
    ]),
  ],
  controllers: [EbarimtController],
  providers:   [EbarimtService],
  exports:     [EbarimtService],
})
export class EbarimtModule {}
