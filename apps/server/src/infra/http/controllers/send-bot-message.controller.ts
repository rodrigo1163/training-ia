import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
import z from 'zod';
import { SendBotMessageUseCase, type SendBotMessageEvent } from '@/domain/application/use-cases/send-bot-message';
import { ConversationBusyError, DuplicateChatMessageError, OriginNotAllowedError, PublicChatNotFoundError } from '@/domain/application/use-cases/errors/public-chat-errors';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const bodySchema = z.object({
  conversationId: z.uuid().optional(),
  clientMessageId: z.uuid(),
  content: z.string().trim().min(1).max(4000),
  context: z.object({
    pageUrl: z.url().max(2000).optional(),
    pageTitle: z.string().trim().max(200).optional(),
    locale: z.string().trim().max(20).optional(),
  }).optional(),
});
type SendMessageBody = z.infer<typeof bodySchema>;
const bodyPipe = new ZodValidationPipe(bodySchema);

@Controller('public/chat/:deploymentKey/messages')
@AllowAnonymous()
export class SendBotMessageController {
  constructor(private readonly sendBotMessage: SendBotMessageUseCase) {}

  @Post()
  async handle(
    @Param('deploymentKey') deploymentKey: string,
    @Body(bodyPipe) body: SendMessageBody,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const abortController = new AbortController();
    response.on('close', () => {
      if (!response.writableEnded) abortController.abort();
    });

    const result = await this.sendBotMessage.execute({
      deploymentKey,
      origin: request.get('origin'),
      conversationId: body.conversationId,
      clientMessageId: body.clientMessageId,
      content: body.content,
      context: body.context,
      signal: abortController.signal,
    });

    const outcome = result.isLeft()
      ? { error: result.value! }
      : { output: result.value! };
    if ('error' in outcome) {
      const error = outcome.error!;
      const errorMessage = error.message;
      switch (true) {
        case error instanceof PublicChatNotFoundError:
          throw new NotFoundException(error.message);
        case error instanceof OriginNotAllowedError:
          throw new ForbiddenException(error.message);
        case error instanceof DuplicateChatMessageError || error instanceof ConversationBusyError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(errorMessage);
      }
    }

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    for await (const event of outcome.output!.events) {
      if (response.destroyed) break;
      response.write(this.serializeEvent(event));
    }

    if (!response.destroyed) response.end();
  }

  private serializeEvent(event: SendBotMessageEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  }

}
