import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { DrugOption, DrugOptionType } from "@his/shared";
import { DrugOptionEntity, DrugOptionDocument } from "./drug-option.schema";

@Injectable()
export class DrugOptionsService {
  constructor(
    @InjectModel(DrugOptionEntity.name)
    private readonly model: Model<DrugOptionDocument>,
  ) {}

  private toShared(doc: DrugOptionDocument): DrugOption {
    return {
      id:    doc._id.toString(),
      type:  doc.type,
      name:  doc.name,
      order: doc.order,
    };
  }

  async list(): Promise<DrugOption[]> {
    const docs = await this.model.find().sort({ type: 1, order: 1, createdAt: 1 }).exec();
    return docs.map((d) => this.toShared(d));
  }

  async create(dto: { type: DrugOptionType; name: string }): Promise<DrugOption> {
    const count = await this.model.countDocuments({ type: dto.type });
    const doc = await this.model.create({ type: dto.type, name: dto.name, order: count });
    return this.toShared(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException("Сонголт олдсонгүй");
  }
}
