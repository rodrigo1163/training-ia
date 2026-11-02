import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { GeneratedStarterQuestionUsage } from '@/domain/enterprise/entities/generated-starter-question-usage';
import type { BotGeneratedStarterQuestionUsage as PrismaGeneratedStarterQuestionUsage } from '../../../../../prisma/generated/prisma/client';

export class PrismaGeneratedStarterQuestionUsageMapper {
  static toDomain(raw: PrismaGeneratedStarterQuestionUsage) {
    return GeneratedStarterQuestionUsage.create(
      {
        generatedStarterQuestionId: new UniqueEntityId(
          raw.generatedStarterQuestionId,
        ),
        conversationId: new UniqueEntityId(raw.conversationId),
        shownAt: raw.shownAt,
        clickedAt: raw.clickedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }
}
