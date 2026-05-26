import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Имэйл буруу байна" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Нууц үг 6-аас доошгүй тэмдэгт байх ёстой" })
  password!: string;
}
