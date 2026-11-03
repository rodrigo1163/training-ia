import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import z from 'zod';
import { GetPublicChatConfigUseCase } from '@/domain/application/use-cases/get-public-chat-config';
import { PublicChatNotFoundError } from '@/domain/application/use-cases/errors/public-chat-errors';
import { PublicChatConfigPresenter } from '@/infra/http/presenters/public-chat-config-presenter';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const querySchema = z.object({
  conversationId: z.uuid().optional(),
});
type GetPublicChatConfigQuery = z.infer<typeof querySchema>;
const queryPipe = new ZodValidationPipe(querySchema);

@Controller('public/chat/:deploymentKey/config')
@AllowAnonymous()
export class GetPublicChatConfigController {
  constructor(
    private readonly getPublicChatConfig: GetPublicChatConfigUseCase,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async handle(
    @Param('deploymentKey') deploymentKey: string,
    @Query(queryPipe) query: GetPublicChatConfigQuery,
  ) {
    const result = await this.getPublicChatConfig.execute({
      deploymentKey,
      conversationId: query.conversationId,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof PublicChatNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new NotFoundException();
    }

    return {
      config: PublicChatConfigPresenter.toHTTP(
        result.value.bot.chatConfig,
        result.value.bot.style,
        result.value.starterQuestions,
      ),
    };
  }
}
