import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  InstrumentalExamResult,
  InstrumentalExamResultSchema,
} from "./instrumental-exam-result.schema";
import {
  InstrumentalExamFile,
  InstrumentalExamFileSchema,
} from "./instrumental-exam-file.schema";
import { InstrumentalExamsService }    from "./instrumental-exams.service";
import { InstrumentalExamsController } from "./instrumental-exams.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InstrumentalExamResult.name, schema: InstrumentalExamResultSchema },
      { name: InstrumentalExamFile.name,   schema: InstrumentalExamFileSchema   },
    ]),
  ],
  controllers: [InstrumentalExamsController],
  providers:   [InstrumentalExamsService],
})
export class InstrumentalExamsModule {}
