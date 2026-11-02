import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import z from 'zod';
import { GenerateStarterQuestionUseCase } from '@/domain/application/use-cases/generate-starter-question';
import {
  InvalidStarterQuestionError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from '@/domain/application/use-cases/errors/public-chat-errors';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const bodySchema = z.object({
  conversationId: z.uuid(),
  userMessageId: z.uuid(),
  slot: z.number().int().min(0).max(2),
  clickedQuestion: z.string().trim().min(1).max(120),
});
type GenerateStarterQuestionBody = z.infer<typeof bodySchema>;
const bodyPipe = new ZodValidationPipe(bodySchema);

@Controller('public/chat/:deploymentKey/starter-questions')
@AllowAnonymous()
export class GenerateStarterQuestionController {
  constructor(
    private readonly generateStarterQuestion: GenerateStarterQuestionUseCase,
  ) { }

  @Post()
  async handle(
    @Param('deploymentKey') deploymentKey: string,
    @Body(bodyPipe) body: GenerateStarterQuestionBody,
    @Req() request: Request,
  ) {
    const abortController = new AbortController();
    const onClose = () => abortController.abort();
    request.on('aborted', onClose);

    try {
      const result = await this.generateStarterQuestion.execute({
        deploymentKey,
        origin: request.get('origin'),
        conversationId: body.conversationId,
        userMessageId: body.userMessageId,
        slot: body.slot,
        clickedQuestion: body.clickedQuestion,
        signal: abortController.signal,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof PublicChatNotFoundError) {
          throw new NotFoundException(error.message);
        }

        if (error instanceof OriginNotAllowedError) {
          throw new ForbiddenException(error.message);
        }

        if (error instanceof InvalidStarterQuestionError) {
          throw new BadRequestException(error.message);
        }

        throw new BadRequestException();
      }

      return result.value;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadGatewayException(
        'The starter question could not be generated.',
      );
    } finally {
      request.off('aborted', onClose);
    }
  }
}
