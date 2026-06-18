import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { HospitalConfig, UpdateHospitalConfigInput } from "@his/shared";
import { HospitalConfigEntity, HospitalConfigDocument } from "./hospital-config.schema";

@Injectable()
export class HospitalConfigService {
  constructor(
    @InjectModel(HospitalConfigEntity.name)
    private readonly model: Model<HospitalConfigDocument>,
  ) {}

  private toShared(doc: HospitalConfigDocument): HospitalConfig {
    return {
      id:            doc._id.toString(),
      name:          doc.name,
      logoBase64:    doc.logoBase64,
      faviconBase64: doc.faviconBase64,
      updatedAt:     (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async get(): Promise<HospitalConfig> {
    let doc = await this.model.findOne({}).exec();
    if (!doc) {
      doc = await this.model.create({});
    }
    return this.toShared(doc);
  }

  async update(dto: UpdateHospitalConfigInput): Promise<HospitalConfig> {
    const doc = await this.model.findOneAndUpdate(
      {},
      { $set: dto },
      { new: true, upsert: true },
    ).exec();
    return this.toShared(doc!);
  }
}
