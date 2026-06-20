import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { DrugOptionsService } from "./drug-options.service";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

class CreateDrugOptionDto {
  @IsIn(["manufacturer", "category"])
  type!: "manufacturer" | "category";

  @IsString() @MinLength(1) @MaxLength(200)
  name!: string;
}

@Controller("drug-options")
export class DrugOptionsController {
  constructor(private readonly service: DrugOptionsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE)
  list() {
    return this.service.list();
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  create(@Body() dto: CreateDrugOptionDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
