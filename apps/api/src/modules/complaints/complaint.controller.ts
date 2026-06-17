import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ROLES } from "@his/shared";
import type { AuthUser } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ComplaintService } from "./complaint.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { CreateComplaintOptionDto } from "./dto/create-complaint-option.dto";

@Controller()
export class ComplaintController {
  constructor(private readonly service: ComplaintService) {}

  /* ── Complaint options (admin-managed) ───────────────────────────── */

  @Get("complaint-options")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  listOptions() {
    return this.service.listOptions();
  }

  @Post("complaint-options")
  @Roles(ROLES.ADMIN)
  createOption(@Body() dto: CreateComplaintOptionDto) {
    return this.service.createOption(dto);
  }

  @Delete("complaint-options/:id")
  @Roles(ROLES.ADMIN)
  async deleteOption(@Param("id") id: string) {
    await this.service.deleteOption(id);
    return { success: true };
  }

  /* ── Patient complaints ──────────────────────────────────────────── */

  @Get("patients/:id/complaints")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  listByPatient(@Param("id") id: string) {
    return this.service.listByPatient(id);
  }

  @Post("patients/:id/complaints")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  createComplaint(
    @Param("id") id: string,
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(id, dto, user);
  }

  @Delete("patients/:patientId/complaints/:cid")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteComplaint(@Param("cid") cid: string) {
    await this.service.deleteComplaint(cid);
    return { success: true };
  }
}
