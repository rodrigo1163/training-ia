import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../prisma/generated/prisma/client';
import { GeneratedStarterQuestionRepository, type CreateGeneratedStarterQuestionInput } from '@/domain/application/repositories/generated-starter-question-repository';
import { GeneratedStarterQuestion } from '@/domain/enterprise/entities/generated-starter-question';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaGeneratedStarterQuestionMapper } from '../mappers/prisma-generated-starter-question-mapper';

@Injectable()
export class PrismaGeneratedStarterQuestionRepository
  implements GeneratedStarterQuestionRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByBotId(botId: string): Promise<GeneratedStarterQuestion[]> {
    const questions = await this.prisma.botGeneratedStarterQuestion.findMany({
      where: { botId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return questions.map(PrismaGeneratedStarterQuestionMapper.toDomain);
  }

  async findByBotIdForConversation(
    botId: string,
    conversationId?: string,
  ): Promise<GeneratedStarterQuestion[]> {
    const questions = await this.prisma.botGeneratedStarterQuestion.findMany({
      where: { botId },
      include: {
        usages: {
          select: {
            conversationId: true,
            shownAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const candidates = questions
      .filter((question) =>
        conversationId === undefined ||
        !question.usages.some((usage) => usage.conversationId === conversationId),
      )
      .sort((first, second) => {
        const firstLastShownAt = latestShownAt(first.usages);
        const secondLastShownAt = latestShownAt(second.usages);

        if (firstLastShownAt === null && secondLastShownAt !== null) return -1;
        if (firstLastShownAt !== null && secondLastShownAt === null) return 1;

        if (firstLastShownAt !== null && secondLastShownAt !== null) {
          const shownAtDifference =
            firstLastShownAt.getTime() - secondLastShownAt.getTime();

          if (shownAtDifference !== 0) return shownAtDifference;
        }

        return (
          first.createdAt.getTime() - second.createdAt.getTime() ||
          first.id.localeCompare(second.id)
        );
      });

    return candidates.map(PrismaGeneratedStarterQuestionMapper.toDomain);
  }

  async findByIdempotencyKey(
    botId: string,
    idempotencyKey: string,
  ): Promise<GeneratedStarterQuestion | null> {
    const question = await this.prisma.botGeneratedStarterQuestion.findFirst({
      where: { botId, idempotencyKey },
    });

    return question
      ? PrismaGeneratedStarterQuestionMapper.toDomain(question)
      : null;
  }

  async create(
    input: CreateGeneratedStarterQuestionInput,
  ): Promise<GeneratedStarterQuestion | null> {
    try {
      const question = await this.prisma.botGeneratedStarterQuestion.create({
        data: {
          id: randomUUID(),
          botId: input.botId,
          idempotencyKey: input.idempotencyKey,
          originalText: input.originalText,
          normalizedText: input.normalizedText,
        },
      });

      return PrismaGeneratedStarterQuestionMapper.toDomain(question);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.findByIdempotencyKey(input.botId, input.idempotencyKey);
      }

      throw error;
    }
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.botGeneratedStarterQuestion.update({
      where: { id },
      data: { status: 'USED' },
    });
  }
}

function latestShownAt(usages: Array<{ shownAt: Date }>): Date | null {
  return usages.reduce<Date | null>(
    (latest, usage) =>
      latest === null || usage.shownAt > latest ? usage.shownAt : latest,
    null,
  );
}
