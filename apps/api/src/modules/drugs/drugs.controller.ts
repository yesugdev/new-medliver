import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DrugsService } from "./drugs.service";
import { CreateDrugDto, UpdateDrugDto, AdjustStockDto, CreateBatchDto } from "./dto/drug.dto";

const CLINICAL = [ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION];
/** Эм бүртгэл, цуврал, тайлан хариуцах */
const MANAGE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION];

@Controller("drugs")
export class DrugsController {
  constructor(private readonly drugs: DrugsService) {}

  /** List drugs — all clinical staff can read */
  @Get()
  @Roles(...CLINICAL)
  list(@Query("activeOnly") activeOnly?: string) {
    return this.drugs.list(activeOnly !== "false");
  }

  /** Дуусах хугацаа ойртсон цувралууд */
  @Get("expiring")
  @Roles(...MANAGE)
  expiring(@Query("days") days?: string) {
    return this.drugs.listExpiring(days ? Number(days) : 30);
  }

  /** Тайлан — нөөцийн үнэлгээ, доод хэмжээ, дуусах хугацаа */
  @Get("reports")
  @Roles(...MANAGE)
  reports() {
    return this.drugs.reports();
  }

  /** Excel татах — бүх эм + цуврал */
  @Get("export")
  @Roles(...MANAGE)
  exportAll() {
    return this.drugs.exportAll();
  }

  @Get(":id")
  @Roles(...CLINICAL)
  get(@Param("id") id: string) {
    return this.drugs.getById(id);
  }

  @Get(":id/batches")
  @Roles(...CLINICAL)
  batches(@Param("id") id: string) {
    return this.drugs.listBatches(id);
  }

  @Get(":id/movements")
  @Roles(...MANAGE)
  movements(@Param("id") id: string) {
    return this.drugs.listMovements(id);
  }

  @Post()
  @Roles(...MANAGE)
  create(@Body() dto: CreateDrugDto, @CurrentUser() actor: AuthUser) {
    return this.drugs.create(dto, { id: actor.id, name: actor.fullName });
  }

  /** Орлого — шинэ цуврал нэмэх */
  @Post(":id/batches")
  @Roles(...MANAGE)
  addBatch(@Param("id") id: string, @Body() dto: CreateBatchDto, @CurrentUser() actor: AuthUser) {
    return this.drugs.addBatch(id, dto, { id: actor.id, name: actor.fullName });
  }

  @Patch(":id")
  @Roles(...MANAGE)
  update(@Param("id") id: string, @Body() dto: UpdateDrugDto) {
    return this.drugs.update(id, dto);
  }

  /** Гар нөөц тохируулга */
  @Patch(":id/stock")
  @Roles(...MANAGE)
  adjustStock(@Param("id") id: string, @Body() dto: AdjustStockDto, @CurrentUser() actor: AuthUser) {
    return this.drugs.adjustStock(id, dto.delta, { id: actor.id, name: actor.fullName });
  }

  @Delete(":id")
  @Roles(...MANAGE)
  async remove(@Param("id") id: string) {
    await this.drugs.remove(id);
    return { success: true };
  }
}
