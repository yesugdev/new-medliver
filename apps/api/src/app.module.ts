import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { resolve } from "path";
import configuration from "./config/configuration";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { EmrModule } from "./modules/emr/emr.module";
import { BillingModule } from "./modules/billing/billing.module";
import { StatsModule } from "./modules/stats/stats.module";
import { LabModule } from "./modules/lab/lab.module";
import { VitalsModule } from "./modules/vitals/vitals.module";
import { DrugsModule } from "./modules/drugs/drugs.module";
import { PrintConfigModule } from "./modules/print-config/print-config.module";
import { TreatmentTaskModule } from "./modules/treatment-tasks/treatment-task.module";
import { ComplaintModule } from "./modules/complaints/complaint.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "../../.env"),
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("mongoUri"),
      }),
    }),
    AuthModule,
    UsersModule,
    PatientsModule,
    AuditModule,
    AppointmentsModule,
    EmrModule,
    BillingModule,
    StatsModule,
    LabModule,
    VitalsModule,
    DrugsModule,
    PrintConfigModule,
    TreatmentTaskModule,
    ComplaintModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
