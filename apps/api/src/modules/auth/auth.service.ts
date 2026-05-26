import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { LoginResponse } from "@his/shared";
import { UsersService } from "../users/users.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ipAddress?: string): Promise<LoginResponse> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException("Имэйл эсвэл нууц үг буруу байна");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.audit.record({
        action: "auth.login_failed",
        actorEmail: email,
        ipAddress,
      });
      throw new UnauthorizedException("Имэйл эсвэл нууц үг буруу байна");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user._id.toString(),
      email: user.email,
    });

    await this.users.touchLastLogin(user._id.toString());
    await this.audit.record({
      action: "auth.login_success",
      actorId: user._id.toString(),
      actorEmail: user.email,
      ipAddress,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
