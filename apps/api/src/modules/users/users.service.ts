import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import * as bcrypt from "bcrypt";
import type { Role, SystemUser } from "@his/shared";
import { User, UserDocument } from "./user.schema";

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
}

export interface UpdateUserData {
  fullName?: string;
  role?: Role;
  phone?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  private toShared(doc: UserDocument): SystemUser {
    return {
      id: doc._id.toString(),
      email: doc.email,
      fullName: doc.fullName,
      role: doc.role,
      phone: doc.phone,
      avatar: (doc as any).avatar,
      isActive: doc.isActive,
      lastLoginAt: doc.lastLoginAt?.toISOString(),
      createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async create(dto: CreateUserData): Promise<UserDocument> {
    const existing = await this.model.findOne({ email: dto.email.toLowerCase() }).lean();
    if (existing) {
      throw new ConflictException("Энэ имэйл бүртгэгдсэн байна");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.model.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      phone: dto.phone,
    });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.model
      .findOne({ email: email.toLowerCase(), isActive: true })
      .select("+passwordHash")
      .exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.model.findById(id).exec();
    if (!user) throw new NotFoundException("Хэрэглэгч олдсонгүй");
    return user;
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
  }

  async list(params: { role?: Role; search?: string }): Promise<SystemUser[]> {
    const filter: FilterQuery<UserDocument> = {};
    if (params.role) filter.role = params.role;
    if (params.search?.trim()) {
      const safe = params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { email: { $regex: safe, $options: "i" } },
        { fullName: { $regex: safe, $options: "i" } },
      ];
    }
    const docs = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    return docs.map((d) => this.toShared(d));
  }

  async listDoctors(): Promise<SystemUser[]> {
    const docs = await this.model
      .find({ role: "doctor", isActive: true })
      .sort({ fullName: 1 })
      .exec();
    return docs.map((d) => this.toShared(d));
  }

  async getById(id: string): Promise<SystemUser> {
    return this.toShared(await this.findById(id));
  }

  async update(id: string, dto: UpdateUserData): Promise<SystemUser> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    await user.save();
    return this.toShared(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException("Нууц үг 6-аас доошгүй тэмдэгт");
    }
    const user = await this.findById(id);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async setActive(id: string, isActive: boolean): Promise<SystemUser> {
    return this.update(id, { isActive });
  }

  async createShared(dto: CreateUserData): Promise<SystemUser> {
    return this.toShared(await this.create(dto));
  }

  async updateProfile(
    id: string,
    dto: { fullName?: string; phone?: string; avatar?: string },
  ): Promise<SystemUser> {
    const user = await this.findById(id);
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.phone !== undefined) (user as any).phone = dto.phone;
    if (dto.avatar !== undefined) (user as any).avatar = dto.avatar;
    await user.save();
    return this.toShared(user);
  }

  async changeMyPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.model
      .findById(id)
      .select("+passwordHash")
      .exec();
    if (!user) throw new NotFoundException("Хэрэглэгч олдсонгүй");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("Одоогийн нууц үг буруу байна");
    if (newPassword.length < 6)
      throw new BadRequestException("Нууц үг 6-аас доошгүй тэмдэгт");
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
  }
}
