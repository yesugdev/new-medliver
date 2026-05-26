export default () => ({
  port: parseInt(process.env.API_PORT ?? "4000", 10),
  mongoUri:
    process.env.MONGO_URI ??
    "mongodb://hisroot:hisrootpass@localhost:27017/hospital_his?authSource=admin",
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@hospital.mn",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
    adminName: process.env.SEED_ADMIN_NAME ?? "Системийн админ",
  },
});
