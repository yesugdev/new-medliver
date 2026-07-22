import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
} from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { LabService } from "./lab.service";
import { CreateLabTestDto } from "./dto/create-lab-test.dto";
import { UpdateLabTestDto } from "./dto/update-lab-test.dto";
import { CreateLabOrderDto } from "./dto/create-lab-order.dto";
import { RecordResultsDto } from "./dto/record-results.dto";
import { QuickResultDto } from "./dto/quick-result.dto";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { UpdateOrderDateDto } from "./dto/update-order-date.dto";
import { ReorderTestsDto } from "./dto/reorder-tests.dto";

/* ── Test catalog (admin) ──────────────────────────────────────────── */
@Controller("lab/tests")
export class LabTestsController {
  constructor(private readonly svc: LabService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.MANAGER, ROLES.RECEPTION)
  list(@Query("all") all?: string) {
    return this.svc.listTests(all === "true");
  }

  @Post()
  @Roles(ROLES.ADMIN)
  create(@Body() dto: CreateLabTestDto, @CurrentUser() user: AuthUser) {
    return this.svc.createTest(dto, user);
  }

  /** Багануудын (шинжилгээний) дарааллыг солих — sortOrder-ыг дараалуулж бичнэ */
  @Put("reorder")
  @Roles(ROLES.ADMIN)
  reorder(@Body() dto: ReorderTestsDto, @CurrentUser() user: AuthUser) {
    return this.svc.reorderTests(dto.ids, user);
  }

  @Patch(":id")
  @Roles(ROLES.ADMIN)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateLabTestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.updateTest(id, dto, user);
  }
}

/* ── Orders ────────────────────────────────────────────────────────── */
@Controller("lab/orders")
export class LabOrdersController {
  constructor(private readonly svc: LabService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE)
  list(@Query() query: ListOrdersDto, @CurrentUser() user: AuthUser) {
    return this.svc.listOrders(query, user);
  }

  @Get(":id")
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE)
  get(@Param("id") id: string) {
    return this.svc.getOrder(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  create(@Body() dto: CreateLabOrderDto, @CurrentUser() user: AuthUser) {
    return this.svc.createOrder(dto, user);
  }

  /** Захиалга үүсгэлгүйгээр шууд хариу оруулах */
  @Post("quick")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  quickResult(@Body() dto: QuickResultDto, @CurrentUser() user: AuthUser) {
    return this.svc.quickResult(dto, user);
  }

  @Patch(":id/results")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  recordResults(
    @Param("id") id: string,
    @Body() dto: RecordResultsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.recordResults(id, dto, user);
  }

  @Patch(":id/cancel")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR)
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.svc.cancelOrder(id, user);
  }

  /** Нэг тестийн хариуг устгах — зөвхөн admin */
  @Delete(":id/results/:testId")
  @Roles(ROLES.ADMIN)
  deleteResult(
    @Param("id") id: string,
    @Param("testId") testId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.deleteResult(id, testId, user);
  }

  /** Захиалгын огноог засах — зөвхөн admin */
  @Patch(":id/date")
  @Roles(ROLES.ADMIN)
  updateDate(
    @Param("id") id: string,
    @Body() dto: UpdateOrderDateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.updateOrderDate(id, dto, user);
  }
}
