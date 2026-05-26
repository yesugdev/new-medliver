import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ServiceItem, ServiceItemDocument } from "./service-item.schema";
import { CreateServiceDto, UpdateServiceDto } from "./dto/service.dto";

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(ServiceItem.name) private readonly model: Model<ServiceItemDocument>,
  ) {}

  async list(activeOnly = false) {
    const filter = activeOnly ? { isActive: true } : {};
    const items = await this.model.find(filter).sort({ category: 1, name: 1 }).lean();
    return items.map((i) => ({
      id: i._id.toString(),
      code: i.code,
      name: i.name,
      category: i.category,
      price: i.price,
      isActive: i.isActive,
    }));
  }

  async create(dto: CreateServiceDto) {
    const dup = await this.model.findOne({ code: dto.code }).lean();
    if (dup) throw new ConflictException("Энэ кодтой үйлчилгээ байна");
    const created = await this.model.create({ ...dto, isActive: dto.isActive ?? true });
    return {
      id: created._id.toString(),
      code: created.code,
      name: created.name,
      category: created.category,
      price: created.price,
      isActive: created.isActive,
    };
  }

  async update(id: string, dto: UpdateServiceDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Үйлчилгээ олдсонгүй");
    Object.assign(doc, dto);
    await doc.save();
    return {
      id: doc._id.toString(),
      code: doc.code,
      name: doc.name,
      category: doc.category,
      price: doc.price,
      isActive: doc.isActive,
    };
  }

  async remove(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Үйлчилгээ олдсонгүй");
    (doc as any).deletedAt = new Date();
    await doc.save();
  }
}
