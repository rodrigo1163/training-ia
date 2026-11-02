import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import {
  GeneratedStarterQuestion,
} from '@/domain/enterprise/entities/generated-starter-question';
import type {
  BotGeneratedStarterQuestion as PrismaGeneratedStarterQuestion,
} from '../../../../../prisma/generated/prisma/client';

export class PrismaGeneratedStarterQuestionMapper {
  static toDomain(raw: PrismaGeneratedStarterQuestion) {
    return GeneratedStarterQuestion.create(
      {
        botId: new UniqueEntityId(raw.botId),
        originalText: raw.originalText,
        normalizedText: raw.normalizedText,
        status: raw.status,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }
}
