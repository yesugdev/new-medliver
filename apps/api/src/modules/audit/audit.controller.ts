import { Controller, Get, Query } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuditLog, AuditLogDocument } from "./audit.schema";

class ListAuditDto {
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() resource?: string;
  @IsOptional() @IsString() actorEmail?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 50;
}

@Controller("audit")
export class AuditController {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  @Get()
  @Roles(ROLES.ADMIN)
  async list(@Query() q: ListAuditDto) {
    const filter: FilterQuery<AuditLogDocument> = {};
    if (q.action) filter.action = { $regex: q.action, $options: "i" };
    if (q.resource) filter.resource = q.resource;
    if (q.actorEmail) filter.actorEmail = { $regex: q.actorEmail, $options: "i" };

    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      items: docs.map((d) => ({
        id: d._id.toString(),
        actorEmail: d.actorEmail,
        action: d.action,
        resource: d.resource,
        resourceId: d.resourceId,
        meta: d.meta,
        ipAddress: d.ipAddress,
        createdAt: (d as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }
}
