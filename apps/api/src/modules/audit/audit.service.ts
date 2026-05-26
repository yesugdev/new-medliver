import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditLog } from "./audit.schema";

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLog>) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.model.create({
        ...entry,
        actorId: entry.actorId,
      });
    } catch (err) {
      this.logger.warn(`Audit log failed: ${(err as Error).message}`);
    }
  }
}
