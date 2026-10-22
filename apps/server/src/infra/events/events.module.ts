import { Module } from '@nestjs/common';
import { EnvModule } from '@/infra/env/env.module';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { OnDocumentProcessingRequested } from '@/domain/application/subscribers/on-document-processing-requested';
import { RabbitMqService } from '@/infra/messaging/rabbitmq/rabbitmq.service';
import { RabbitMqDocumentProcessingPublisher } from '@/infra/messaging/rabbitmq/rabbitmq-document-processing-publisher';

@Module({
  imports: [EnvModule],
  providers: [
    RabbitMqService,
    RabbitMqDocumentProcessingPublisher,
    {
      provide: DocumentProcessingPublisher,
      useExisting: RabbitMqDocumentProcessingPublisher,
    },
    OnDocumentProcessingRequested,
  ],
})
export class EventsModule {}
