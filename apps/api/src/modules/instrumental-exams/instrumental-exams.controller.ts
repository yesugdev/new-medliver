import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ROLES } from "@his/shared";
import type { AuthUser, InstrumentalExamType } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { InstrumentalExamsService } from "./instrumental-exams.service";
import { CreateExamResultDto } from "./dto/create-exam-result.dto";
import { CreateExamFileDto }   from "./dto/create-exam-file.dto";

const ALL      = [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION];
const CLINICAL = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE];

@Controller("patients/:patientId/instrumental")
export class InstrumentalExamsController {
  constructor(private readonly service: InstrumentalExamsService) {}

  /* ── Results ─────────────────────────────────────────────────────── */

  @Get("results")
  @Roles(...ALL)
  listResults(
    @Param("patientId") patientId: string,
    @Query("examType") examType: InstrumentalExamType,
  ) {
    return this.service.listResults(patientId, examType);
  }

  @Post("results")
  @Roles(...CLINICAL)
  createResult(
    @Param("patientId") patientId: string,
    @Body() dto: CreateExamResultDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createResult(patientId, dto, user);
  }

  @Delete("results/:rid")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteResult(@Param("rid") rid: string) {
    await this.service.deleteResult(rid);
    return { success: true };
  }

  /* ── Files ───────────────────────────────────────────────────────── */

  @Get("files")
  @Roles(...ALL)
  listFiles(
    @Param("patientId") patientId: string,
    @Query("examType") examType: InstrumentalExamType,
  ) {
    return this.service.listFiles(patientId, examType);
  }

  @Post("files")
  @Roles(...CLINICAL)
  createFile(
    @Param("patientId") patientId: string,
    @Body() dto: CreateExamFileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createFile(patientId, dto, user);
  }

  @Delete("files/:fid")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  async deleteFile(@Param("fid") fid: string) {
    await this.service.deleteFile(fid);
    return { success: true };
  }
}
