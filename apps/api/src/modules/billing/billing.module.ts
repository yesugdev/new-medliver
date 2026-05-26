import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ServiceItem, ServiceItemSchema } from "./service-item.schema";
import { Invoice, InvoiceSchema } from "./invoice.schema";
import { Patient, PatientSchema } from "../patients/patient.schema";
import { ServicesService } from "./services.service";
import { InvoicesService } from "./invoices.service";
import { ServicesController, InvoicesController } from "./billing.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceItem.name, schema: ServiceItemSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
  ],
  controllers: [ServicesController, InvoicesController],
  providers: [ServicesService, InvoicesService],
  exports: [ServicesService, InvoicesService],
})
export class BillingModule {}
