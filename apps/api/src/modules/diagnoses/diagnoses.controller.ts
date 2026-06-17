import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ROLES } from "@his/shared";
import type { AuthUser } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DiagnosesService } from "./diagnoses.service";
import { CreatePatientDiagnosisDto } from "./dto/create-diagnosis.dto";
import { CreateClinicalScoreDto } from "./dto/create-clinical-score.dto";

const ALL = [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION];
const CLINICAL = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE];

@Controller()
export class DiagnosesController {
  constructor(private readonly service: DiagnosesService) {}

  /* ── Diagnoses ───────────────────────────────────────────────────── */

  @Get("patients/:id/diagnoses")
  @Roles(...ALL)
  listDiagnoses(@Param("id") id: string) {
    return this.service.listDiagnoses(id);
  }

  @Post("patients/:id/diagnoses")
  @Roles(...CLINICAL)
  createDiagnosis(
    @Param("id") id: string,
    @Body() dto: CreatePatientDiagnosisDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createDiagnosis(id, dto, user);
  }

  @Delete("patients/:patientId/diagnoses/:did")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteDiagnosis(@Param("did") did: string) {
    await this.service.deleteDiagnosis(did);
    return { success: true };
  }

  /* ── Clinical scores ─────────────────────────────────────────────── */

  @Get("patients/:id/clinical-scores")
  @Roles(...ALL)
  listScores(@Param("id") id: string) {
    return this.service.listScores(id);
  }

  @Post("patients/:id/clinical-scores")
  @Roles(...CLINICAL)
  createScore(
    @Param("id") id: string,
    @Body() dto: CreateClinicalScoreDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createScore(id, dto, user);
  }

  @Delete("patients/:patientId/clinical-scores/:sid")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteScore(@Param("sid") sid: string) {
    await this.service.deleteScore(sid);
    return { success: true };
  }
}
