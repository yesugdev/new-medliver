import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type {
  AuthUser,
  InstrumentalExamResult as IResult,
  InstrumentalExamFile   as IFile,
  InstrumentalExamType,
} from "@his/shared";
import {
  InstrumentalExamResult,
  InstrumentalExamResultDocument,
} from "./instrumental-exam-result.schema";
import {
  InstrumentalExamFile,
  InstrumentalExamFileDocument,
} from "./instrumental-exam-file.schema";
import { CreateExamResultDto } from "./dto/create-exam-result.dto";
import { CreateExamFileDto }   from "./dto/create-exam-file.dto";

@Injectable()
export class InstrumentalExamsService {
  constructor(
    @InjectModel(InstrumentalExamResult.name)
    private readonly resultModel: Model<InstrumentalExamResultDocument>,
    @InjectModel(InstrumentalExamFile.name)
    private readonly fileModel: Model<InstrumentalExamFileDocument>,
  ) {}

  /* ── Results ─────────────────────────────────────────────────────── */

  async listResults(patientId: string, examType: InstrumentalExamType): Promise<IResult[]> {
    const docs = await this.resultModel
      .find({ patientId: new Types.ObjectId(patientId), examType })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(this.toResult);
  }

  async createResult(patientId: string, dto: CreateExamResultDto, actor: AuthUser): Promise<IResult> {
    const doc = await this.resultModel.create({
      patientId: new Types.ObjectId(patientId),
      examType: dto.examType,
      date: dto.date,
      result: dto.result,
      notes: dto.notes,
      recordedById:   new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.toResult(doc as any);
  }

  async deleteResult(id: string): Promise<void> {
    const doc = await this.resultModel.findById(id);
    if (!doc) throw new NotFoundException("Шинжилгээний хариу олдсонгүй");
    await doc.deleteOne();
  }

  /* ── Files ───────────────────────────────────────────────────────── */

  async listFiles(patientId: string, examType: InstrumentalExamType): Promise<IFile[]> {
    const docs = await this.fileModel
      .find({ patientId: new Types.ObjectId(patientId), examType })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(this.toFile);
  }

  async createFile(patientId: string, dto: CreateExamFileDto, actor: AuthUser): Promise<IFile> {
    const doc = await this.fileModel.create({
      patientId: new Types.ObjectId(patientId),
      examType:  dto.examType,
      date:      dto.date,
      fileName:  dto.fileName,
      fileSize:  dto.fileSize,
      mimeType:  dto.mimeType,
      fileData:  dto.fileData,
      notes:     dto.notes,
      recordedById:   new Types.ObjectId(actor.id),
      recordedByName: actor.fullName ?? actor.email,
    });
    return this.toFile(doc as any);
  }

  async deleteFile(id: string): Promise<void> {
    const doc = await this.fileModel.findById(id);
    if (!doc) throw new NotFoundException("Файл олдсонгүй");
    await doc.deleteOne();
  }

  /* ── Mappers ─────────────────────────────────────────────────────── */

  private toResult(d: any): IResult {
    return {
      id:             d._id.toString(),
      patientId:      d.patientId.toString(),
      examType:       d.examType,
      date:           d.date,
      result:         d.result,
      notes:          d.notes,
      recordedById:   d.recordedById.toString(),
      recordedByName: d.recordedByName,
      createdAt:      d.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private toFile(d: any): IFile {
    return {
      id:             d._id.toString(),
      patientId:      d.patientId.toString(),
      examType:       d.examType,
      date:           d.date,
      fileName:       d.fileName,
      fileSize:       d.fileSize,
      mimeType:       d.mimeType,
      fileData:       d.fileData,
      notes:          d.notes,
      recordedById:   d.recordedById.toString(),
      recordedByName: d.recordedByName,
      createdAt:      d.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
