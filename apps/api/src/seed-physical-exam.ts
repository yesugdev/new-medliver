/**
 * Migration: Add "Биеийн үзлэг" tab to existing EMR templates.
 * Run once: npx ts-node -r tsconfig-paths/register src/seed-physical-exam.ts
 */
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "./app.module";
import { EmrTemplate, EmrTemplateDocument, PHYSICAL_EXAM_TAB } from "./modules/emr/emr-template.schema";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"],
  });
  const logger = new Logger("SeedPhysicalExam");
  const model = app.get<Model<EmrTemplateDocument>>(getModelToken(EmrTemplate.name));

  const doc = await model.findOne({ key: "default" }).lean();
  if (!doc) {
    logger.warn("EMR template document not found – run the app once to create it, then re-run this script.");
    await app.close();
    return;
  }

  const tabs: any[] = (doc.config as any)?.tabs ?? [];
  const alreadyExists = tabs.some((t: any) => t.id === "tab_physical_exam");
  if (alreadyExists) {
    logger.warn("'Биеийн үзлэг' tab already exists – skipping.");
    await app.close();
    return;
  }

  await model.updateOne(
    { key: "default" },
    { $push: { "config.tabs": PHYSICAL_EXAM_TAB } },
  );

  logger.log("✓ 'Биеийн үзлэг' tab added to EMR template (6 sections, 28 fields).");
  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
