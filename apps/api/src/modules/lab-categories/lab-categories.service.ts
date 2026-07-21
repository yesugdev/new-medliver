import { BadRequestException, Injectable, NotFoundException, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { AuthUser, LabCategoryDef } from "@his/shared";
import { DEFAULT_LAB_CATEGORIES } from "@his/shared";
import { LabCategoryEntity, LabCategoryDocument } from "./lab-category.schema";
import { LabTest, LabTestDocument } from "../lab/lab-test.schema";
import { AuditService } from "../audit/audit.service";
import { CreateLabCategoryDto } from "./dto/create-lab-category.dto";
import { UpdateLabCategoryDto } from "./dto/update-lab-category.dto";

@Injectable()
export class LabCategoriesService implements OnModuleInit {
  private readonly logger = new Logger(LabCategoriesService.name);

  constructor(
    @InjectModel(LabCategoryEntity.name) private readonly model: Model<LabCategoryDocument>,
    @InjectModel(LabTest.name)           private readonly testModel: Model<LabTestDocument>,
    private readonly audit: AuditService,
  ) {}

  /** Анхны системийн ангиллуудыг idempotent байдлаар үүсгэнэ — олон орчинд дахин ажиллахад давхардахгүй */
  async onModuleInit() {
    for (const def of DEFAULT_LAB_CATEGORIES) {
      await this.model.findOneAndUpdate(
        { key: def.key },
        { $setOnInsert: { key: def.key, name: def.name, isActive: true, isDefault: true, sortOrder: def.sortOrder } },
        { upsert: true },
      ).exec();
    }
    this.logger.log(`Lab category seed эхлэл шалгалт дууслаа (${DEFAULT_LAB_CATEGORIES.length})`);
  }

  private toShared(doc: LabCategoryDocument): LabCategoryDef {
    return {
      id:        doc._id.toString(),
      key:       doc.key,
      name:      doc.name,
      nameEn:    doc.nameEn,
      isActive:  doc.isActive,
      isDefault: doc.isDefault,
      sortOrder: doc.sortOrder,
      createdAt: (doc as any).createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async list(includeInactive = false): Promise<LabCategoryDef[]> {
    const filter = includeInactive ? {} : { isActive: true };
    const docs = await this.model.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
    return docs.map((d) => this.toShared(d));
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.model.countDocuments({ key }).exec();
    return count > 0;
  }

  async create(dto: CreateLabCategoryDto, actor: AuthUser): Promise<LabCategoryDef> {
    const key = dto.key.trim().toLowerCase();
    const dup = await this.model.findOne({ key }).lean();
    if (dup) throw new BadRequestException(`'${key}' түлхүүртэй ангилал аль хэдийн бүртгэгдсэн байна`);

    const doc = await this.model.create({
      key,
      name: dto.name.trim(),
      nameEn: dto.nameEn?.trim() || undefined,
      sortOrder: dto.sortOrder ?? 0,
      isActive: true,
      isDefault: false,
    });

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_category.create", resource: "lab_category", resourceId: doc._id.toString(),
    });

    return this.toShared(doc);
  }

  async update(id: string, dto: UpdateLabCategoryDto, actor: AuthUser): Promise<LabCategoryDef> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Ангилал олдсонгүй");

    if (dto.name !== undefined)      doc.name      = dto.name.trim();
    if (dto.nameEn !== undefined)    doc.nameEn    = dto.nameEn.trim() || undefined;
    if (dto.sortOrder !== undefined) doc.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined)  doc.isActive  = dto.isActive;

    await doc.save();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_category.update", resource: "lab_category", resourceId: id,
    });

    return this.toShared(doc);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException("Ангилал олдсонгүй");
    if (doc.isDefault)
      throw new BadRequestException("Системийн үндсэн ангиллыг устгах боломжгүй.");

    const inUse = await this.testModel.countDocuments({ category: doc.key }).exec();
    if (inUse > 0)
      throw new BadRequestException("Энэ ангилалд бүртгэлтэй шинжилгээ байгаа тул устгах боломжгүй.");

    await this.model.deleteOne({ _id: id }).exec();

    await this.audit.record({
      actorId: actor.id, actorEmail: actor.email,
      action: "lab_category.delete", resource: "lab_category", resourceId: id,
    });
  }
}
