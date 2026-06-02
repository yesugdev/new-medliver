import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TreatmentTaskService } from "./treatment-task.service";
import {
  CreateTreatmentTaskDto,
  UpdateTreatmentTaskDto,
  ListTreatmentTasksDto,
} from "./dto/treatment-task.dto";

@Controller("treatment-tasks")
export class TreatmentTaskController {
  constructor(private readonly svc: TreatmentTaskService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  list(@Query() query: ListTreatmentTasksDto) {
    return this.svc.list(query);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  create(@Body() dto: CreateTreatmentTaskDto, @CurrentUser() user: AuthUser) {
    return this.svc.create(dto, user);
  }

  @Patch(":id/status")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTreatmentTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.updateStatus(id, dto, user);
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async delete(@Param("id") id: string) {
    await this.svc.delete(id);
    return { success: true };
  }
}
