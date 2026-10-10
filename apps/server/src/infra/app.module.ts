import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { createAuth } from '@/infra/auth/auth'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { EnvService } from '@/infra/env/env.service'
import { AppController } from '@/infra/http/controllers/app.controller'
import { HealthController } from '@/infra/http/controllers/health.controller'

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [EnvModule, DatabaseModule],
      inject: [EnvService, PrismaService],
      useFactory: (envService: EnvService, prismaService: PrismaService) => ({
        auth: createAuth(prismaService, {
          HOST: envService.get('HOST'),
          PORT: envService.get('PORT'),
          DATABASE_URL: envService.get('DATABASE_URL'),
          BETTER_AUTH_SECRET: envService.get('BETTER_AUTH_SECRET'),
          BETTER_AUTH_URL: envService.get('BETTER_AUTH_URL'),
          CLIENT_ORIGIN: envService.get('CLIENT_ORIGIN'),
        }),
      }),
    }),
  ],
  controllers: [AppController, HealthController],
})
export class AppModule {}
