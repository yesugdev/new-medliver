# Hospital Information System (HIS)

Монгол Улсын жижиг эмнэлэг, клиникт зориулсан Hospital Information System.

**v0.2.0** — Бүх үндсэн модуль бүрэн ажиллаж байна.

## Modules

| Module | Backend | Frontend | Roles |
| --- | :-: | :-: | --- |
| Authentication + RBAC | ✅ | ✅ | all |
| Patient Management | ✅ | ✅ | reception, admin (CRUD); all (view) |
| Appointment & Queue | ✅ | ✅ | reception (create), doctor (workflow) |
| EMR (Visit, Vitals, Prescription) | ✅ | ✅ | doctor, nurse |
| Billing (Services, Invoices, Payments) | ✅ | ✅ | reception, manager, admin |
| User Management | ✅ | ✅ | admin |
| Audit Log Viewer | ✅ | ✅ | admin |
| Dashboard Analytics | ✅ | ✅ | all (role-based) |

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 15.1, React 19, TypeScript, TailwindCSS, shadcn pattern |
| State    | TanStack Query v5, Zustand                        |
| Backend  | NestJS 10, TypeScript                             |
| Auth     | JWT, Passport, bcrypt, RBAC                       |
| Database | MongoDB 7, Mongoose                               |
| Shared   | `@his/shared` workspace package                   |

## Setup

```powershell
cd C:\Users\Dell\Desktop\hospital-his

# 1. .env үүсгэх
Copy-Item .env.example .env

# 2. Dependencies (postinstall автоматаар shared-г build хийнэ)
npm install

# 3. MongoDB ажиллаж байгаа эсэхийг шалгах
#    Local: Get-Service MongoDB
#    Docker: npm run db:up

# 4. Анхны мэдээлэл seed хийх (админ, эмч, регистратор, сувилагч, үйлчилгээний жагсаалт)
npm run seed

# 5. Frontend + Backend асаах
npm run dev
```

- Backend: http://localhost:4000/api
- Frontend: http://localhost:3000

## Default Login (seed-ээс үүснэ)

| Role | Email | Password |
| --- | --- | --- |
| Админ | `admin@hospital.mn` | `Admin@123` |
| Эмч | `emch@hospital.mn` | `Doctor@123` |
| Регистратор | `registr@hospital.mn` | `Reception@123` |
| Сувилагч | `suvilagch@hospital.mn` | `Nurse@123` |

> Production-д заавал нууц үгийг солих + `JWT_SECRET`-ийг урт random string болгох.

## Typical Workflow

1. **Регистратор** — өвчтөн бүртгэх → цаг захиалга үүсгэх → дараалалд оруулах ("Бүртгэх" товч)
2. **Эмч** — `/queue` хуудаснаас өвчтөнийг сонгож "EMR нээх" → үзлэгийн карт бөглөх → "Үзлэг дуусгах"
3. **Регистратор** — өвчтөний дэлгэрэнгүй хуудаснаас Шинэ нэхэмжлэл үүсгэж төлбөр хүлээн авах
4. **Менежер** — Dashboard, орлогын тайлан харах
5. **Админ** — Users, Audit, Services удирдах

## API Endpoints (v0.2.0)

### Auth
- `POST /api/auth/login` (public)
- `GET /api/auth/me`

### Patients
- `GET /api/patients` · `GET /api/patients/:id`
- `POST /api/patients` (admin, reception)
- `PATCH /api/patients/:id` (admin, reception, doctor, nurse)
- `DELETE /api/patients/:id` (admin)

### Appointments
- `GET /api/appointments` · `GET /api/appointments/:id`
- `GET /api/appointments/queue` (доктор бол өөрийн дараалал)
- `POST /api/appointments` (admin, reception)
- `PATCH /api/appointments/:id/check-in` · `start` · `complete` · `cancel` · `no-show`

### EMR (Visits)
- `GET /api/visits?patientId=...`
- `GET /api/visits/:id`
- `POST /api/visits` · `PATCH /api/visits/:id`

### Billing
- `GET /api/services` · `POST /api/services` · `PATCH /api/services/:id` · `DELETE /api/services/:id`
- `GET /api/invoices` · `GET /api/invoices/:id`
- `POST /api/invoices` · `POST /api/invoices/:id/payments` · `PATCH /api/invoices/:id/cancel`

### Users (admin)
- `GET /api/users` · `GET /api/users/:id`
- `GET /api/users/doctors` (бүгд)
- `POST /api/users` · `PATCH /api/users/:id` · `PATCH /api/users/:id/password`

### Audit + Stats
- `GET /api/audit` (admin)
- `GET /api/stats/dashboard`

## Project Structure

```
hospital-his/
├── apps/
│   ├── api/                       # NestJS backend
│   │   └── src/
│   │       ├── common/            # guards, filters, decorators, plugins
│   │       ├── config/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── patients/
│   │       │   ├── appointments/
│   │       │   ├── emr/
│   │       │   ├── billing/
│   │       │   ├── audit/
│   │       │   └── stats/
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       └── seed.ts
│   └── web/                       # Next.js 15 frontend
│       └── src/
│           ├── app/
│           │   ├── login/
│           │   └── (app)/         # protected routes
│           │       ├── dashboard/
│           │       ├── patients/
│           │       ├── appointments/
│           │       ├── queue/
│           │       ├── emr/
│           │       ├── billing/
│           │       ├── users/     # admin
│           │       ├── audit/     # admin
│           │       └── settings/  # admin
│           ├── components/        # UI + features
│           ├── lib/               # api clients, utils
│           └── stores/
├── packages/
│   └── shared/                    # @his/shared
│       └── src/                   # roles, patient, auth, appointment, emr, billing, stats, audit
├── docker-compose.yml
└── package.json                   # npm workspaces
```

## Architecture Notes

- **Soft delete** — `deletedAt` плагин бүх collection-д
- **Audit logging** — global `AuditService`, бүх mutation-д бүртгэгдэнэ
- **RBAC** — `@Roles(...)` + global `RolesGuard`, `@Public()` декоратор login-д
- **Shared types** — TypeScript типүүд FE/BE-д ижил `@his/shared`-ээс
- **JWT** — Header bearer, 12 цагийн TTL
- **Auto codes** — Patient `P{year}-00001`, Invoice `INV{year}-00001`
- **Queue** — өдөр тутамд эмч тус бүрд автомат дугаарлалт
- **Stats** — `/stats/dashboard` дашборд 30s тутамд polling

## Roadmap

- [ ] Multi-branch (clinic) дэмжлэг
- [ ] Laboratory module (шинжилгээний хариу)
- [ ] Pharmacy module (эмийн агуулах)
- [ ] SMS notification (цаг сануулга)
- [ ] Patient portal (өвчтөний эрх)
- [ ] Telemedicine (видео үзлэг)
- [ ] Insurance integration
- [ ] Excel/PDF export тайлан
- [ ] Mobile app (React Native)

## Production Deployment Checklist

- [ ] `JWT_SECRET` урт random string (`openssl rand -base64 64`)
- [ ] Бүх seed нууц үг солих
- [ ] `MONGO_URI` production Atlas/cluster connection string
- [ ] `CORS_ORIGIN` production domain-аар хязгаарлах
- [ ] HTTPS терминэйшн (reverse proxy)
- [ ] MongoDB backup стратеги
- [ ] Audit log retention policy
- [ ] Log aggregation (Sentry, Datadog гэх мэт)
"# new-medliver" 
# new-medliver
