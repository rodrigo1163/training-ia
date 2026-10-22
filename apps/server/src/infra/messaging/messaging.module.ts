import { Module } from '@nestjs/common';
import { DocumentStatusEventHub } from '@/domain/application/messaging/document-status-events';
import { EnvModule } from '@/infra/env/env.module';
import { RedisService } from './redis/redis.service.js';
import { RedisDocumentStatusEventHub } from './redis/redis-document-status-event-hub.js';

@Module({
  imports: [EnvModule],
  providers: [
    RedisService,
    RedisDocumentStatusEventHub,
    {
      provide: DocumentStatusEventHub,
      useExisting: RedisDocumentStatusEventHub,
    },
  ],
  exports: [DocumentStatusEventHub],
})
export class MessagingModule { }
