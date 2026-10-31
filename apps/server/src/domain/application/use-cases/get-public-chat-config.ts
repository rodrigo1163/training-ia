import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { BotRepository } from '../repositories/bot-repository';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { PublicChatNotFoundError } from './errors/public-chat-errors';
import type { Bot } from '../../enterprise/entities/bot';

type GetPublicChatConfigUseCaseResponse = Either<
  PublicChatNotFoundError,
  { bot: Bot }
>;

@Injectable()
export class GetPublicChatConfigUseCase {
  constructor(
    private readonly deployments: BotDeploymentRepository,
    private readonly bots: BotRepository,
  ) {}

  async execute(input: {
    deploymentKey: string;
  }): Promise<GetPublicChatConfigUseCaseResponse> {
    const deployment = await this.deployments.findByPublicKey(
      input.deploymentKey,
    );

    if (!deployment || deployment.status !== 'ACTIVE') {
      return left(new PublicChatNotFoundError());
    }

    const bot = await this.bots.findById(deployment.botId.toString());

    if (!bot) return left(new PublicChatNotFoundError());

    return right({ bot });
  }
}
