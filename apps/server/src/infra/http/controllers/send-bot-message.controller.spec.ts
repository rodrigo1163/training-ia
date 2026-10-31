import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { left } from '@/core/either';
import {
  ChatConversationMessageLimitReachedError,
  ChatDailyMessageLimitReachedError,
} from '@/domain/application/use-cases/errors/public-chat-errors';
import { SendBotMessageController } from './send-bot-message.controller';

describe('SendBotMessageController', () => {
  it.each([
    [
      new ChatDailyMessageLimitReachedError(),
      'chat_daily_limit_reached',
    ],
    [
      new ChatConversationMessageLimitReachedError(),
      'chat_conversation_limit_reached',
    ],
  ])('returns the limit error code with HTTP 429', async (error, code) => {
    const controller = new SendBotMessageController({
      execute: async () => left(error),
    } as never);

    const request = { get: () => 'https://example.com' } as unknown as Request;
    const response = { on: vi.fn() } as unknown as Response;
    const result = controller.handle(
      'deployment-key',
      { clientMessageId: 'message-id', content: 'hello' },
      request,
      response,
    );

    await expect(result).rejects.toBeInstanceOf(HttpException);

    try {
      await result;
    } catch (caught) {
      const exception = caught as HttpException;
      expect(exception.getStatus()).toBe(429);
      expect(exception.getResponse()).toEqual({
        code,
        message: error.message,
      });
    }
  });
});
