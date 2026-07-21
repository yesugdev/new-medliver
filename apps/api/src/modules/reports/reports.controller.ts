import { Body, Controller, ForbiddenException, Get, Put, Query } from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES, ALL_ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";
import { ReportAccessService } from "./report-access.service";
import { ReportRangeDto } from "./dto/report-range.dto";
import { UpdateReportAccessDto } from "./dto/update-report-access.dto";

@Controller("reports")
export class ReportsController {
  constructor(
    private readonly svc: ReportsService,
    private readonly access: ReportAccessService,
  ) {}

  /* ── Access config ─────────────────────────────────────────────── */

  /** Аль role-ууд тайлан харах эрхтэйг буцаана — sidebar/nav ашиглана */
  @Get("access")
  @Roles(...ALL_ROLES)
  getAccess() {
    return this.access.get();
  }

  @Put("access")
  @Roles(ROLES.ADMIN)
  setAccess(@Body() dto: UpdateReportAccessDto) {
    return this.access.set(dto.roles);
  }

  /* ── Report data (admin + тохируулсан role-ууд) ────────────────── */

  private async guard(user: AuthUser) {
    if (!(await this.access.canAccess(user.role))) {
      throw new ForbiddenException("Тайлан харах эрх танд алга");
    }
  }

  @Get("patient")
  @Roles(...ALL_ROLES)
  async patient(@Query() q: ReportRangeDto, @CurrentUser() user: AuthUser) {
    await this.guard(user);
    return this.svc.patientReport(q.from, q.to);
  }

  @Get("laboratory")
  @Roles(...ALL_ROLES)
  async laboratory(@Query() q: ReportRangeDto, @CurrentUser() user: AuthUser) {
    await this.guard(user);
    return this.svc.laboratoryReport(q.from, q.to);
  }

  @Get("financial")
  @Roles(...ALL_ROLES)
  async financial(@Query() q: ReportRangeDto, @CurrentUser() user: AuthUser) {
    await this.guard(user);
    return this.svc.financialReport(q.from, q.to);
  }
}
