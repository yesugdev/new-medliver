import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAppointmentDto {
  @IsMongoId({ message: "Өвчтөн буруу" })
  patientId!: string;

  @IsMongoId({ message: "Эмч буруу" })
  doctorId!: string;

  @IsDateString({}, { message: "Огноо буруу" })
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes?: number;

  @IsEnum(["consultation", "follow_up", "walk_in", "emergency"])
  type!: "consultation" | "follow_up" | "walk_in" | "emergency";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
