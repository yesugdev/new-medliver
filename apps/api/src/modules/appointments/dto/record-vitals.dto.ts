import { IsNumber, IsOptional, Min, Max } from "class-validator";

export class RecordVitalsDto {
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  bloodPressureSystolic?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  bloodPressureDiastolic?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  respiratoryRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number;
}
