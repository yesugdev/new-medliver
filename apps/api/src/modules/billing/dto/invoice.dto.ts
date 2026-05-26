import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class InvoiceItemInputDto {
  @IsOptional() @IsMongoId() serviceId?: string;
  @IsString() name!: string;
  @IsNumber() @Min(0.01) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreateInvoiceDto {
  @IsMongoId({ message: "Өвчтөн буруу" })
  patientId!: string;

  @IsOptional()
  @IsMongoId()
  visitId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Дор хаяж нэг үйлчилгээ нэмнэ үү" })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items!: InvoiceItemInputDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(["cash", "card", "transfer", "insurance"])
  method!: "cash" | "card" | "transfer" | "insurance";

  @IsOptional()
  @IsString()
  note?: string;
}
