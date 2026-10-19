import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotDeployment } from '@/domain/enterprise/entities/bot-deployment';
import type { BotDeployment as PrismaBotDeployment, Prisma } from '@training-ia/database/client';

export class PrismaBotDeploymentMapper {
  static toDomain(raw: PrismaBotDeployment): BotDeployment {
    return BotDeployment.create(
      {
        botId: new UniqueEntityId(raw.botId),
        publicKey: raw.publicKey,
        status: raw.status,
        allowedOrigins: raw.allowedOrigins,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(deployment: BotDeployment): Prisma.BotDeploymentUncheckedCreateInput {
    return {
      id: deployment.id.toString(),
      botId: deployment.botId.toString(),
      publicKey: deployment.publicKey,
      status: deployment.status,
      allowedOrigins: deployment.allowedOrigins,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt ?? undefined,
    };
  }
}
