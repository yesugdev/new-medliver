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
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { ListPatientsDto } from "./dto/list-patients.dto";

@Controller("patients")
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  list(@Query() query: ListPatientsDto) {
    return this.patients.list(query);
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  get(@Param("id") id: string) {
    return this.patients.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patients.create(dto, user);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patients.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.patients.remove(id, user);
    return { success: true };
  }
}
