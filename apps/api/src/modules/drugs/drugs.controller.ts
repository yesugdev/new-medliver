import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { DrugsService } from "./drugs.service";
import { CreateDrugDto, UpdateDrugDto, AdjustStockDto } from "./dto/drug.dto";

@Controller("drugs")
export class DrugsController {
  constructor(private readonly drugs: DrugsService) {}

  /** List drugs — all clinical staff can read */
  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  list(@Query("activeOnly") activeOnly?: string) {
    return this.drugs.list(activeOnly !== "false");
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  get(@Param("id") id: string) {
    return this.drugs.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateDrugDto) {
    return this.drugs.create(dto);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateDrugDto) {
    return this.drugs.update(id, dto);
  }

  /** Adjust stock manually (admin only) */
  @Patch(":id/stock")
  @Roles(ROLES.ADMIN)
  adjustStock(@Param("id") id: string, @Body() dto: AdjustStockDto) {
    return this.drugs.deductStock(id, -dto.delta); // delta>0 = add
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN)
  async remove(@Param("id") id: string) {
    await this.drugs.remove(id);
    return { success: true };
  }
}
