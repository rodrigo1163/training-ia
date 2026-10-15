import type { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';

export class BotDeploymentPresenter {
  static toHTTP(deployment: BotDeployment) {
    return {
      id: deployment.id.toString(),
      publicKey: deployment.publicKey,
      status: deployment.status,
      allowedOrigins: deployment.allowedOrigins,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }
}
