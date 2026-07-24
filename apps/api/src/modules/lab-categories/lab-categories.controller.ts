import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { LabCategoriesService } from "./lab-categories.service";
import { CreateLabCategoryDto } from "./dto/create-lab-category.dto";
import { UpdateLabCategoryDto } from "./dto/update-lab-category.dto";

@Controller("lab-categories")
export class LabCategoriesController {
  constructor(private readonly svc: LabCategoriesService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION, ROLES.LAB)
  list(@Query("all") all?: string) {
    return this.svc.list(all === "true");
  }

  @Post()
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateLabCategoryDto, @CurrentUser() user: AuthUser) {
    return this.svc.create(dto, user);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateLabCategoryDto, @CurrentUser() user: AuthUser) {
    return this.svc.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN)
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.svc.remove(id, user);
    return { success: true };
  }
}
