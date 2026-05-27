import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmrTemplate, EmrTemplateDocument, DEFAULT_TEMPLATE_CONFIG } from "./emr-template.schema";
import type { EmrTemplateConfig } from "@his/shared";

@Injectable()
export class EmrTemplateService {
  constructor(
    @InjectModel(EmrTemplate.name)
    private readonly model: Model<EmrTemplateDocument>,
  ) {}

  async getTemplate(): Promise<EmrTemplateConfig> {
    let doc = await this.model.findOne({ key: "default" }).lean();
    if (!doc) {
      const created = await this.model.create({
        key: "default",
        config: DEFAULT_TEMPLATE_CONFIG,
      });
      return {
        id: created._id.toString(),
        tabs: DEFAULT_TEMPLATE_CONFIG.tabs as any,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      id: (doc as any)._id.toString(),
      tabs: (doc.config as any)?.tabs ?? [],
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async updateTemplate(tabs: any[]): Promise<EmrTemplateConfig> {
    const doc = await this.model.findOneAndUpdate(
      { key: "default" },
      { $set: { config: { tabs } } },
      { new: true, upsert: true },
    ).lean();
    return {
      id: (doc as any)._id.toString(),
      tabs: (doc!.config as any)?.tabs ?? [],
      updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
