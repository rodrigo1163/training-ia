import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { BotRepository } from '../repositories/bot-repository';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { PublicChatNotFoundError } from './errors/public-chat-errors';
import type { Bot } from '../../enterprise/entities/bot';
import { GeneratedStarterQuestionRepository } from '../repositories/generated-starter-question-repository';
import { selectStarterQuestions } from './select-starter-questions';

type GetPublicChatConfigUseCaseResponse = Either<
  PublicChatNotFoundError,
  { bot: Bot; starterQuestions: string[] }
>;

@Injectable()
export class GetPublicChatConfigUseCase {
  constructor(
    private readonly deployments: BotDeploymentRepository,
    private readonly bots: BotRepository,
    private readonly generatedQuestions: GeneratedStarterQuestionRepository,
  ) {}

  async execute(input: {
    deploymentKey: string;
    conversationId?: string;
  }): Promise<GetPublicChatConfigUseCaseResponse> {
    const deployment = await this.deployments.findByPublicKey(
      input.deploymentKey,
    );

    if (!deployment || deployment.status !== 'ACTIVE') {
      return left(new PublicChatNotFoundError());
    }

    const bot = await this.bots.findById(deployment.botId.toString());

    if (!bot) return left(new PublicChatNotFoundError());

    const generatedQuestions =
      await this.generatedQuestions.findByBotIdForConversation(
        bot.id.toString(),
        input.conversationId,
      );

    return right({
      bot,
      starterQuestions: selectStarterQuestions({
        configuredQuestions: bot.chatConfig.starterQuestions,
        generatedQuestions,
      }),
    });
  }
}
