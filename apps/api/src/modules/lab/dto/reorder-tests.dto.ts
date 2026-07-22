import { ArrayMinSize, IsArray, IsMongoId } from "class-validator";

export class ReorderTestsDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsMongoId({ each: true })
  ids!: string[];
}
