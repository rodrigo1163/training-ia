import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { GetPublicChatConfigUseCase } from '@/domain/application/use-cases/get-public-chat-config';
import { PublicChatNotFoundError } from '@/domain/application/use-cases/errors/public-chat-errors';
import { PublicChatConfigPresenter } from '@/infra/http/presenters/public-chat-config-presenter';

@Controller('public/chat/:deploymentKey/config')
@AllowAnonymous()
export class GetPublicChatConfigController {
  constructor(private readonly getPublicChatConfig: GetPublicChatConfigUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async handle(@Param('deploymentKey') deploymentKey: string) {
    const result = await this.getPublicChatConfig.execute({ deploymentKey });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof PublicChatNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new NotFoundException();
    }

    return {
      config: PublicChatConfigPresenter.toHTTP(result.value.bot.chatConfig),
    };
  }
}
