import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { EbarimtService } from "./ebarimt.service";
import { UpdateEbarimtConfigDto } from "./dto/update-ebarimt-config.dto";

const BILLING_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION] as const;

@Controller("ebarimt")
export class EbarimtController {
  constructor(private readonly svc: EbarimtService) {}

  /* Config — унших нь billing role-уудад (товч харуулах эсэхийг шийднэ) */
  @Get("config")
  @Roles(...BILLING_ROLES)
  getConfig() {
    return this.svc.getConfig();
  }

  @Put("config")
  @Roles(ROLES.ADMIN)
  updateConfig(@Body() dto: UpdateEbarimtConfigDto) {
    return this.svc.updateConfig(dto);
  }

  /** PosAPI холболт шалгах */
  @Get("info")
  @Roles(ROLES.ADMIN)
  info() {
    return this.svc.info();
  }

  @Get("receipt/:invoiceId")
  @Roles(...BILLING_ROLES)
  getReceipt(@Param("invoiceId") invoiceId: string) {
    return this.svc.getReceiptByInvoice(invoiceId);
  }

  @Post("receipt/:invoiceId")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  createReceipt(@Param("invoiceId") invoiceId: string, @CurrentUser() user: AuthUser) {
    return this.svc.createReceipt(invoiceId, user);
  }

  @Delete("receipt/:invoiceId")
  @Roles(ROLES.ADMIN)
  async deleteReceipt(@Param("invoiceId") invoiceId: string, @CurrentUser() user: AuthUser) {
    await this.svc.deleteReceipt(invoiceId, user);
    return { success: true };
  }
}
