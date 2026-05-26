import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { EmrService } from "./emr.service";
import { CreateVisitDto } from "./dto/create-visit.dto";
import { UpdateVisitDto } from "./dto/update-visit.dto";

@Controller("visits")
export class EmrController {
  constructor(private readonly service: EmrService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.MANAGER)
  list(@Query("patientId") patientId: string) {
    return this.service.listByPatient(patientId);
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.MANAGER)
  get(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateVisitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }
}
