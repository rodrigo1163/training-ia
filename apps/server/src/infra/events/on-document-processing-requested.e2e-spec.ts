import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import amqp, { type Channel, type ChannelModel } from 'amqplib';
import {
  DOCUMENT_PROCESSING_QUEUE,
  documentProcessingMessageSchema,
} from '@training-ia/contracts/messaging';
import { DomainEvents } from '@training-ia/core/events/domain-events';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { DocumentRepository } from '@/domain/application/repositories/document-repository';
import { ProcessDocumentConsumer } from '@/infra/messaging/rabbitmq/process-document.consumer';
import { BotFactory } from '../../../test/factories/make-bot.js';
import { makeDocument } from '../../../test/factories/make-document.js';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../test/e2e/helpers/auth.js';

describe('On document processing requested (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let documents: DocumentRepository;
  let rabbitConnection: ChannelModel;
  let rabbitChannel: Channel;
  let botId: UniqueEntityId;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    })
      .overrideProvider(ProcessDocumentConsumer)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    documents = moduleRef.get(DocumentRepository);

    await app.init();

    const rabbitMqUrl = process.env.RABBITMQ_URL;

    if (!rabbitMqUrl) {
      throw new Error('RABBITMQ_URL is required for this e2e test');
    }

    rabbitConnection = await amqp.connect(rabbitMqUrl);
    rabbitChannel = await rabbitConnection.createChannel();
    await rabbitChannel.assertQueue(DOCUMENT_PROCESSING_QUEUE, {
      durable: true,
    });
    await rabbitChannel.purgeQueue(DOCUMENT_PROCESSING_QUEUE);

    DomainEvents.shouldRun = true;
    auth = await createAuthenticatedTestContext(app);

    const bot = await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Document Events Bot',
    });
    botId = bot.id;
  });

  afterAll(async () => {
    DomainEvents.shouldRun = false;
    await rabbitChannel.close();
    await rabbitConnection.close();
    await app.close();
  });

  test('should publish a document processing message', async () => {
    const document = makeDocument({ botId });
    document.startProcessing();

    await documents.create(document);

    const message = await rabbitChannel.get(DOCUMENT_PROCESSING_QUEUE, {
      noAck: false,
    });

    if (message === false) {
      throw new Error('Expected a document processing message');
    }

    const payload = documentProcessingMessageSchema.parse(
      JSON.parse(message.content.toString('utf8')),
    );

    expect(payload).toEqual({
      documentId: document.id.toString(),
      contentVersion: null,
    });

    rabbitChannel.ack(message);
  });
});
