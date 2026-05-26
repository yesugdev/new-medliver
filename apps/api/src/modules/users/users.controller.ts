import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import {
  CreateUserDto,
  ListUsersDto,
  ResetPasswordDto,
  UpdateUserDto,
} from "./dto/create-user.dto";
import { AuditService } from "../audit/audit.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Roles(ROLES.ADMIN)
  list(@Query() q: ListUsersDto) {
    return this.users.list({ role: q.role, search: q.search });
  }

  @Get("doctors")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.NURSE, ROLES.DOCTOR)
  listDoctors() {
    return this.users.listDoctors();
  }

  @Get(":id")
  @Roles(ROLES.ADMIN)
  get(@Param("id") id: string) {
    return this.users.getById(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    const result = await this.users.createShared(dto);
    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.create",
      resource: "user",
      resourceId: result.id,
      meta: { email: result.email, role: result.role },
    });
    return result;
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.users.update(id, dto);
    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.update",
      resource: "user",
      resourceId: id,
    });
    return result;
  }

  @Patch(":id/password")
  @Roles(ROLES.ADMIN)
  async resetPassword(
    @Param("id") id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.users.resetPassword(id, dto.password);
    await this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.reset_password",
      resource: "user",
      resourceId: id,
    });
    return { success: true };
  }
}
