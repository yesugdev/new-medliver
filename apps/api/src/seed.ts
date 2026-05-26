import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ROLES } from "@his/shared";
import { AppModule } from "./app.module";
import { UsersService } from "./modules/users/users.service";
import { ServiceItem } from "./modules/billing/service-item.schema";

const SAMPLE_USERS = [
  {
    email: "emch@hospital.mn",
    password: "Doctor@123",
    fullName: "Б.Болормаа (жишээ эмч)",
    role: ROLES.DOCTOR,
  },
  {
    email: "registr@hospital.mn",
    password: "Reception@123",
    fullName: "Д.Энхтуяа (жишээ регистратор)",
    role: ROLES.RECEPTION,
  },
  {
    email: "suvilagch@hospital.mn",
    password: "Nurse@123",
    fullName: "С.Алтантуяа (жишээ сувилагч)",
    role: ROLES.NURSE,
  },
];

const SAMPLE_SERVICES = [
  { code: "CONS-01", name: "Ерөнхий үзлэг", category: "consultation" as const, price: 25000 },
  { code: "CONS-02", name: "Мэргэжлийн үзлэг", category: "consultation" as const, price: 45000 },
  { code: "LAB-01", name: "Цусны ерөнхий шинжилгээ", category: "lab" as const, price: 15000 },
  { code: "LAB-02", name: "Шээсний шинжилгээ", category: "lab" as const, price: 8000 },
  { code: "IMG-01", name: "Хэвлийн эхо", category: "imaging" as const, price: 35000 },
  { code: "IMG-02", name: "Цээжний рентген", category: "imaging" as const, price: 20000 },
  { code: "PROC-01", name: "Тариа хийх", category: "procedure" as const, price: 5000 },
  { code: "MED-01", name: "Парацетамол 500мг (10ш)", category: "medication" as const, price: 3000 },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"],
  });
  const logger = new Logger("Seed");
  const users = app.get(UsersService);
  const config = app.get(ConfigService);
  const services = app.get<Model<ServiceItem>>(getModelToken(ServiceItem.name));

  // Admin
  const adminEmail = config.get<string>("seed.adminEmail")!;
  const adminPassword = config.get<string>("seed.adminPassword")!;
  const adminName = config.get<string>("seed.adminName")!;

  try {
    await users.create({
      email: adminEmail,
      password: adminPassword,
      fullName: adminName,
      role: ROLES.ADMIN,
    });
    logger.log(`✓ Админ үүсгэлээ: ${adminEmail} / ${adminPassword}`);
  } catch (err) {
    if ((err as Error).message?.includes("бүртгэгдсэн")) {
      logger.warn(`⊙ Админ аль хэдийн байна: ${adminEmail}`);
    } else {
      logger.error(`✗ Админ алдаа: ${(err as Error).message}`);
    }
  }

  // Sample users
  for (const u of SAMPLE_USERS) {
    try {
      await users.create(u);
      logger.log(`✓ ${u.role}: ${u.email} / ${u.password}`);
    } catch (err) {
      if ((err as Error).message?.includes("бүртгэгдсэн")) {
        logger.warn(`⊙ Аль хэдийн байна: ${u.email}`);
      }
    }
  }

  // Sample services
  for (const s of SAMPLE_SERVICES) {
    try {
      const existing = await services.findOne({ code: s.code }).lean();
      if (existing) {
        logger.warn(`⊙ Үйлчилгээ байна: ${s.code}`);
        continue;
      }
      await services.create({ ...s, isActive: true });
      logger.log(`✓ Үйлчилгээ: ${s.code} - ${s.name}`);
    } catch (err) {
      logger.error(`✗ ${s.code}: ${(err as Error).message}`);
    }
  }

  logger.log("\n========================================");
  logger.log("Seed дууслаа. Дараах эрхээр нэвтрэх боломжтой:");
  logger.log("  Админ:       admin@hospital.mn / Admin@123");
  logger.log("  Эмч:         emch@hospital.mn / Doctor@123");
  logger.log("  Регистратор: registr@hospital.mn / Reception@123");
  logger.log("  Сувилагч:    suvilagch@hospital.mn / Nurse@123");
  logger.log("========================================\n");

  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
