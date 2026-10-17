import type { BotDeploymentRepository } from '../../src/domain/application/repositories/bot-deployment-repository.js';
import type { BotDeployment } from '../../src/domain/enterprise/entities/bot-deployment.js';

export class InMemoryBotDeploymentRepository implements BotDeploymentRepository {
  public items: BotDeployment[] = [];

  async findByBotId(botId: string): Promise<BotDeployment | null> {
    return this.items.find((deployment) => deployment.botId.toString() === botId) ?? null;
  }

  async findByPublicKey(publicKey: string): Promise<BotDeployment | null> {
    return this.items.find((deployment) => deployment.publicKey === publicKey) ?? null;
  }

  async create(deployment: BotDeployment): Promise<void> {
    this.items.push(deployment);
  }

  async update(deployment: BotDeployment): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(deployment.id));

    if (index >= 0) {
      this.items[index] = deployment;
    }
  }
}
