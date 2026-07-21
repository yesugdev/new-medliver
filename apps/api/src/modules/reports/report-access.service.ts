import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { ReportAccessConfig, Role } from "@his/shared";
import { ROLES, ALL_ROLES } from "@his/shared";
import { ReportAccessEntity, ReportAccessDocument } from "./report-access.schema";

@Injectable()
export class ReportAccessService {
  constructor(
    @InjectModel(ReportAccessEntity.name)
    private readonly model: Model<ReportAccessDocument>,
  ) {}

  async get(): Promise<ReportAccessConfig> {
    let doc = await this.model.findOne().exec();
    if (!doc) doc = await this.model.create({ roles: [] });
    // Зөвхөн хүчинтэй role-уудыг буцаах (admin-г давхардуулахгүй)
    const roles = (doc.roles ?? []).filter(
      (r): r is Role => ALL_ROLES.includes(r as Role) && r !== ROLES.ADMIN,
    );
    return { roles };
  }

  async set(roles: Role[]): Promise<ReportAccessConfig> {
    const clean = [...new Set(roles)].filter(
      (r) => ALL_ROLES.includes(r) && r !== ROLES.ADMIN,
    );
    await this.model.findOneAndUpdate({}, { $set: { roles: clean } }, { upsert: true, new: true }).exec();
    return { roles: clean };
  }

  async canAccess(role: Role): Promise<boolean> {
    if (role === ROLES.ADMIN) return true;
    const { roles } = await this.get();
    return roles.includes(role);
  }
}
