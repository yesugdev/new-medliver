/**
 * Seed: Sync the full EMR template config to MongoDB.
 *
 * - If no template exists → creates it with DEFAULT_TEMPLATE_CONFIG (all tabs).
 * - If template exists   → adds any tabs that are missing (by id). Existing tabs are NOT overwritten.
 *
 * Safe to run multiple times (idempotent).
 *
 * Production:  docker exec his-api node apps/api/dist/seed-emr-template.js
 * Local:       cd apps/api && npx ts-node -r tsconfig-paths/register src/seed-emr-template.ts
 */
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "./app.module";
import {
  EmrTemplate,
  EmrTemplateDocument,
  DEFAULT_TEMPLATE_CONFIG,
} from "./modules/emr/emr-template.schema";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"],
  });
  const logger = new Logger("SeedEmrTemplate");
  const model = app.get<Model<EmrTemplateDocument>>(
    getModelToken(EmrTemplate.name),
  );

  const doc = await model.findOne({ key: "default" }).lean();

  if (!doc) {
    // First time — create the full template
    await model.create({ key: "default", config: DEFAULT_TEMPLATE_CONFIG });
    logger.log(
      `✓ EMR template үүсгэлээ — ${DEFAULT_TEMPLATE_CONFIG.tabs.length} tab:`,
    );
    for (const tab of DEFAULT_TEMPLATE_CONFIG.tabs) {
      logger.log(`   • ${tab.name} (${tab.sections.length} section)`);
    }
  } else {
    // Template exists — add only missing tabs
    const existingIds: string[] = ((doc.config as any)?.tabs ?? []).map(
      (t: any) => t.id,
    );
    const missing = DEFAULT_TEMPLATE_CONFIG.tabs.filter(
      (t) => !existingIds.includes(t.id),
    );

    if (missing.length === 0) {
      logger.log("✓ Бүх tab аль хэдийн байна — өөрчлөлт хийгдсэнгүй.");
    } else {
      for (const tab of missing) {
        await model.updateOne(
          { key: "default" },
          { $push: { "config.tabs": tab } },
        );
        logger.log(
          `✓ Tab нэмэгдлээ: "${tab.name}" (${tab.sections.length} section)`,
        );
      }
    }

    // Log existing (skipped) tabs
    for (const id of existingIds) {
      const tab = DEFAULT_TEMPLATE_CONFIG.tabs.find((t) => t.id === id);
      if (tab) logger.warn(`⊙ Аль хэдийн байна — алгасав: "${tab.name}"`);
    }
  }

  logger.log("Seed дууслаа.");
  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
