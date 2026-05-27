import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { EmrTemplateService } from "./emr-template.service";

@Controller("emr/template")
@UseGuards(JwtAuthGuard)
export class EmrTemplateController {
  constructor(private readonly svc: EmrTemplateService) {}

  /** All authenticated users can read the template */
  @Get()
  getTemplate() {
    return this.svc.getTemplate();
  }

  /** Only admin can update the template */
  @Put()
  @UseGuards(RolesGuard)
  @Roles("admin")
  updateTemplate(@Body() body: { tabs: any[] }) {
    return this.svc.updateTemplate(body.tabs ?? []);
  }
}
