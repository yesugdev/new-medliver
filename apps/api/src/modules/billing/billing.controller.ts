import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ServicesService } from "./services.service";
import { InvoicesService } from "./invoices.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto/service.dto";
import { CreateInvoiceDto, RecordPaymentDto } from "./dto/invoice.dto";

class ListInvoicesQuery {
  @IsOptional() patientId?: string;
  @IsOptional() status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number;
}

@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  list(@Query("activeOnly") activeOnly?: string) {
    return this.services.list(activeOnly === "true");
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION)
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION)
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION)
  async remove(@Param("id") id: string) {
    await this.services.remove(id);
    return { success: true };
  }
}

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  list(@Query() q: ListInvoicesQuery) {
    return this.invoices.list({
      patientId: q.patientId,
      status: q.status,
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  get(@Param("id") id: string) {
    return this.invoices.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.invoices.create(dto, user);
  }

  @Post(":id/payments")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  pay(
    @Param("id") id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoices.recordPayment(id, dto, user);
  }

  @Patch(":id/cancel")
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.invoices.cancel(id, user);
  }
}
