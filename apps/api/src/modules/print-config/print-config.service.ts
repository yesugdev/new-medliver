import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { PrintConfig, UpdatePrintConfigInput } from "@his/shared";
import { PrintConfigEntity, PrintConfigDocument } from "./print-config.schema";

const SINGLETON_FILTER = {};

@Injectable()
export class PrintConfigService {
  constructor(
    @InjectModel(PrintConfigEntity.name)
    private readonly model: Model<PrintConfigDocument>,
  ) {}

  private toShared(doc: PrintConfigDocument): PrintConfig {
    return {
      id:               doc._id.toString(),
      orgName:          doc.orgName,
      orgSubtitle:      doc.orgSubtitle,
      orgAddress:       doc.orgAddress,
      orgPhone:         doc.orgPhone,
      orgEmail:         doc.orgEmail,
      logoUrl:          doc.logoUrl,
      showLogo:         doc.showLogo,
      stampUrl:         doc.stampUrl,
      showStamp:        doc.showStamp,
      headerBgColor:    doc.headerBgColor,
      headerTextColor:  doc.headerTextColor,
      fontSize:         doc.fontSize,
      pageSize:         doc.pageSize as "A4" | "A5",
      pageOrientation:  doc.pageOrientation as "portrait" | "landscape",
      footerNote:           doc.footerNote,
      receiptWidth:         doc.receiptWidth as "58" | "76" | "80",
      showPatientCode:      doc.showPatientCode,
      showPatientRegister:  doc.showPatientRegister,
      showPatientAge:       doc.showPatientAge,
      showPatientGender:    doc.showPatientGender,
      showPatientPhone:     doc.showPatientPhone,
      showPatientAddress:   doc.showPatientAddress,
      showPatientBloodType: doc.showPatientBloodType,
      showPatientBirthDate: doc.showPatientBirthDate,
      showPatientDoctor:    doc.showPatientDoctor,
      updatedAt:        (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async get(): Promise<PrintConfig> {
    let doc = await this.model.findOne(SINGLETON_FILTER).exec();
    if (!doc) {
      doc = await this.model.create({});
    }
    return this.toShared(doc);
  }

  async update(dto: UpdatePrintConfigInput): Promise<PrintConfig> {
    const doc = await this.model.findOneAndUpdate(
      SINGLETON_FILTER,
      { $set: dto },
      { new: true, upsert: true },
    ).exec();
    return this.toShared(doc!);
  }
}
