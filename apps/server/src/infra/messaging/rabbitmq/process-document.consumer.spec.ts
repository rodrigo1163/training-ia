import { describe, expect, it, vi } from 'vitest';
import type { ConsumeMessage } from 'amqplib';

import { ProcessDocumentUseCase } from '@/domain/application/use-cases/process-document';
import { ProcessDocumentConsumer } from './process-document.consumer';
import { RabbitMqService } from './rabbitmq.service';
import { DOCUMENT_PROCESSING_QUEUE } from '@/domain/application/messaging/contracts/document-processing';

type ConsumerCallback = (message: ConsumeMessage | null) => void;

function makeSut() {
  const channel = {
    ack: vi.fn(),
    assertQueue: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
  };
  const rabbitMq = {
    getConsumerChannel: vi.fn().mockResolvedValue(channel),
  } as unknown as RabbitMqService;
  const processDocument = {
    execute: vi.fn().mockResolvedValue('READY'),
  } as unknown as ProcessDocumentUseCase;
  const consumer = new ProcessDocumentConsumer(rabbitMq, processDocument);

  return { channel, consumer, processDocument };
}

function makeMessage(payload: unknown): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(payload), 'utf8'),
  } as ConsumeMessage;
}

async function handleMessage(
  consumer: ProcessDocumentConsumer,
  channel: ReturnType<typeof makeSut>['channel'],
  message: ConsumeMessage | null,
): Promise<void> {
  const callback = channel.consume.mock.calls[0]?.[1] as ConsumerCallback;

  callback(message);
  await vi.waitFor(() => {
    expect(channel.ack).toHaveBeenCalled();
  });

  void consumer;
}

describe('ProcessDocumentConsumer', () => {
  it('configures and consumes the durable processing queue one message at a time', async () => {
    const { channel, consumer } = makeSut();

    await consumer.onModuleInit();

    expect(channel.assertQueue).toHaveBeenCalledWith(
      DOCUMENT_PROCESSING_QUEUE,
      { durable: true },
    );
    expect(channel.prefetch).toHaveBeenCalledWith(1);
    expect(channel.consume).toHaveBeenCalledWith(
      DOCUMENT_PROCESSING_QUEUE,
      expect.any(Function),
    );
  });

  it('executes valid messages and acknowledges them', async () => {
    const { channel, consumer, processDocument } = makeSut();
    await consumer.onModuleInit();
    const message = makeMessage({
      documentId: 'document-1',
      contentVersion: null,
    });

    await handleMessage(consumer, channel, message);

    expect(processDocument.execute).toHaveBeenCalledWith({
      documentId: 'document-1',
      contentVersion: null,
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('acknowledges invalid messages without executing the use case', async () => {
    const { channel, consumer, processDocument } = makeSut();
    await consumer.onModuleInit();
    const message = makeMessage({ documentId: '' });

    await handleMessage(consumer, channel, message);

    expect(processDocument.execute).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('acknowledges messages when the use case fails', async () => {
    const { channel, consumer, processDocument } = makeSut();
    vi.mocked(processDocument.execute).mockRejectedValueOnce(new Error('failed'));
    await consumer.onModuleInit();
    const message = makeMessage({
      documentId: 'document-1',
      contentVersion: null,
    });

    await handleMessage(consumer, channel, message);

    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('ignores null messages', async () => {
    const { channel, consumer, processDocument } = makeSut();
    await consumer.onModuleInit();

    const callback = channel.consume.mock.calls[0]?.[1] as ConsumerCallback;
    callback(null);
    await Promise.resolve();

    expect(processDocument.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
