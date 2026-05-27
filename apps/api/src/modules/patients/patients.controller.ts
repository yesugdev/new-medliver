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
import { MedicalHistoryService } from "./medical-history.service";
import { TreatmentService } from "./treatment.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { ListPatientsDto } from "./dto/list-patients.dto";
import { CreateMedicalHistoryDto } from "./dto/create-medical-history.dto";
import { CreateTreatmentDto } from "./dto/create-treatment.dto";

@Controller("patients")
export class PatientsController {
  constructor(
    private readonly patients: PatientsService,
    private readonly medHistory: MedicalHistoryService,
    private readonly treatments: TreatmentService,
  ) {}

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

  /* ── Medical History ────────────────────────────────────────────── */
  @Get(":id/medical-history")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  listMedicalHistory(@Param("id") id: string) {
    return this.medHistory.listByPatient(id);
  }

  @Post(":id/medical-history")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  createMedicalHistory(
    @Param("id") id: string,
    @Body() dto: CreateMedicalHistoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.medHistory.create(id, dto, user);
  }

  @Delete(":patientId/medical-history/:historyId")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteMedicalHistory(@Param("historyId") historyId: string) {
    await this.medHistory.deleteRecord(historyId);
    return { success: true };
  }

  /* ── Treatments ─────────────────────────────────────────────────── */
  @Get(":id/treatments")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  listTreatments(@Param("id") id: string) {
    return this.treatments.listByPatient(id);
  }

  @Post(":id/treatments")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  createTreatment(
    @Param("id") id: string,
    @Body() dto: CreateTreatmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.treatments.create(id, dto, user);
  }

  @Delete(":patientId/treatments/:treatmentId")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteTreatment(@Param("treatmentId") treatmentId: string) {
    await this.treatments.deleteRecord(treatmentId);
    return { success: true };
  }
}
