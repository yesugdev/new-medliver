import { Controller, Get, Query } from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { ReportsService } from "./reports.service";
import { ReportRangeDto } from "./dto/report-range.dto";

@Controller("reports")
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get("patient")
  @Roles(ROLES.ADMIN)
  patient(@Query() q: ReportRangeDto) {
    return this.svc.patientReport(q.from, q.to);
  }

  @Get("laboratory")
  @Roles(ROLES.ADMIN)
  laboratory(@Query() q: ReportRangeDto) {
    return this.svc.laboratoryReport(q.from, q.to);
  }

  @Get("financial")
  @Roles(ROLES.ADMIN)
  financial(@Query() q: ReportRangeDto) {
    return this.svc.financialReport(q.from, q.to);
  }
}
