import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { Drug } from "@his/shared";
import { DrugEntity, DrugDocument } from "./drug.schema";
import { CreateDrugDto, UpdateDrugDto } from "./dto/drug.dto";

@Injectable()
export class DrugsService {
  constructor(
    @InjectModel(DrugEntity.name)
    private readonly model: Model<DrugDocument>,
  ) {}

  private toShared(doc: DrugDocument): Drug {
    return {
      id:          doc._id.toString(),
      name:        doc.name,
      form:        doc.form,
      dosage:      doc.dosage,
      unit:        doc.unit,
      stock:       doc.stock,
      minStock:    doc.minStock,
      description: doc.description,
      isActive:    doc.isActive,
      createdAt:   (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt:   (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async list(activeOnly = true): Promise<Drug[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await this.model.find(filter).sort({ name: 1 }).exec();
    return docs.map((d) => this.toShared(d));
  }

  async getById(id: string): Promise<Drug> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    return this.toShared(doc);
  }

  async create(dto: CreateDrugDto): Promise<Drug> {
    const doc = await this.model.create({
      name:        dto.name,
      form:        dto.form,
      dosage:      dto.dosage,
      unit:        dto.unit,
      stock:       dto.stock,
      minStock:    dto.minStock ?? 0,
      description: dto.description,
    });
    return this.toShared(doc);
  }

  async update(id: string, dto: UpdateDrugDto): Promise<Drug> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    Object.assign(doc, dto);
    await doc.save();
    return this.toShared(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Эм олдсонгүй");
    doc.isActive = false;
    await doc.save();
  }

  /** Deduct qty from stock — called by TreatmentService when saving */
  async deductStock(id: string, qty: number): Promise<void> {
    await this.model.updateOne(
      { _id: id },
      { $inc: { stock: -qty } },
    ).exec();
  }
}
