import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from '@/infra/auth/auth';
import { DatabaseModule } from '@/infra/database/database.module';
import { DocumentProcessingModule } from '@/infra/document-processing/document-processing.module';
import { EventsModule } from '@/infra/events/events.module';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { HttpModule } from '@/infra/http/http.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

@Module({
  imports: [
    EnvModule,
    HttpModule,
    EventsModule,
    DocumentProcessingModule,
    AuthModule.forRootAsync({
      imports: [EnvModule, DatabaseModule],
      inject: [EnvService, PrismaService],
      useFactory: (envService: EnvService, prismaService: PrismaService) => ({
        auth: createAuth(prismaService, {
          BETTER_AUTH_SECRET: envService.get('BETTER_AUTH_SECRET'),
          BETTER_AUTH_URL: envService.get('BETTER_AUTH_URL'),
          CLIENT_ORIGIN: envService.get('CLIENT_ORIGIN'),
        }),
      }),
    }),
  ],
})
export class AppModule {}
