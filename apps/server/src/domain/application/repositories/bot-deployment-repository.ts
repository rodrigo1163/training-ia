import type { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';

export abstract class BotDeploymentRepository {
  abstract findByBotId(botId: string): Promise<BotDeployment | null>;
  abstract findByPublicKey(publicKey: string): Promise<BotDeployment | null>;
  abstract create(deployment: BotDeployment): Promise<void>;
  abstract update(deployment: BotDeployment): Promise<void>;
}
