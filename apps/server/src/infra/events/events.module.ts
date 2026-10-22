import { Module } from '@nestjs/common';
import { EnvModule } from '@/infra/env/env.module';
import { DocumentProcessingPublisher } from '@/domain/application/messaging/document-processing-publisher';
import { OnDocumentCreated } from '@/domain/application/subscribers/on-document-created';
import { RabbitMqDocumentProcessingPublisher } from '@/infra/messaging/rabbitmq/rabbitmq-document-processing-publisher';

@Module({
  imports: [EnvModule],
  providers: [
    RabbitMqDocumentProcessingPublisher,
    {
      provide: DocumentProcessingPublisher,
      useExisting: RabbitMqDocumentProcessingPublisher,
    },
    OnDocumentCreated,
  ],
})
export class EventsModule {}
