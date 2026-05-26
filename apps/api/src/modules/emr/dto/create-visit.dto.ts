import { IsMongoId, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateVisitDto {
  @IsMongoId({ message: "Өвчтөн буруу" })
  patientId!: string;

  @IsOptional()
  @IsMongoId()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;
}
