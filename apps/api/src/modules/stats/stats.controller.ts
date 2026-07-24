import { Controller, Get } from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { StatsService } from "./stats.service";

@Controller("stats")
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get("dashboard")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION, ROLES.LAB)
  dashboard() {
    return this.stats.dashboard();
  }
}
