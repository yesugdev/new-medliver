import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  list(@Query() query: ListAppointmentsDto) {
    return this.service.list(query);
  }

  @Get("queue")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  queue(
    @Query("doctorId") doctorId: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.todayQueue(
      user.role === "doctor" ? user.id : doctorId,
    );
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  get(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(":id/check-in")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.NURSE)
  checkIn(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.checkIn(id, user);
  }

  @Patch(":id/start")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  start(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, "in_progress", user);
  }

  @Patch(":id/complete")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, "completed", user);
  }

  @Patch(":id/cancel")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.DOCTOR)
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, "cancelled", user);
  }

  @Patch(":id/no-show")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.DOCTOR)
  noShow(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, "no_show", user);
  }

}
