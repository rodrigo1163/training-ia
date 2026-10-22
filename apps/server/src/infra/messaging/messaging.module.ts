import { Module } from '@nestjs/common';
import { DocumentStatusEventHub } from '@/domain/application/messaging/document-status-events';
import { EnvModule } from '@/infra/env/env.module';
import { RedisConnection } from '@/infra/connections/redis.connection';
import { RedisDocumentStatusEventHub } from './redis-document-status-event-hub.js';

@Module({
  imports: [EnvModule],
  providers: [
    RedisConnection,
    RedisDocumentStatusEventHub,
    {
      provide: DocumentStatusEventHub,
      useExisting: RedisDocumentStatusEventHub,
    },
  ],
  exports: [DocumentStatusEventHub],
})
export class MessagingModule {}
