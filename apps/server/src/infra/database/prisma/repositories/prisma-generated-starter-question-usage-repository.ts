import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import type { GeneratedStarterQuestionUsageRepository } from '@/domain/application/repositories/generated-starter-question-usage-repository';
import { PrismaGeneratedStarterQuestionUsageMapper } from '../mappers/prisma-generated-starter-question-usage-mapper';
import type { GeneratedStarterQuestionUsage } from '@/domain/enterprise/entities/generated-starter-question-usage';

@Injectable()
export class PrismaGeneratedStarterQuestionUsageRepository
  implements GeneratedStarterQuestionUsageRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByConversationId(
    conversationId: string,
  ): Promise<GeneratedStarterQuestionUsage[]> {
    const usages = await this.prisma.botGeneratedStarterQuestionUsage.findMany({
      where: { conversationId },
      orderBy: [{ shownAt: 'asc' }, { id: 'asc' }],
    });

    return usages.map(PrismaGeneratedStarterQuestionUsageMapper.toDomain);
  }

  async recordShown(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }): Promise<GeneratedStarterQuestionUsage> {
    const usage = await this.prisma.botGeneratedStarterQuestionUsage.upsert({
      where: {
        generatedStarterQuestionId_conversationId: {
          generatedStarterQuestionId: input.generatedStarterQuestionId,
          conversationId: input.conversationId,
        },
      },
      create: {
        id: randomUUID(),
        generatedStarterQuestionId: input.generatedStarterQuestionId,
        conversationId: input.conversationId,
      },
      update: {},
    });

    return PrismaGeneratedStarterQuestionUsageMapper.toDomain(usage);
  }

  async recordClicked(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }): Promise<GeneratedStarterQuestionUsage> {
    const now = new Date();
    const usage = await this.prisma.botGeneratedStarterQuestionUsage.upsert({
      where: {
        generatedStarterQuestionId_conversationId: {
          generatedStarterQuestionId: input.generatedStarterQuestionId,
          conversationId: input.conversationId,
        },
      },
      create: {
        id: randomUUID(),
        generatedStarterQuestionId: input.generatedStarterQuestionId,
        conversationId: input.conversationId,
        shownAt: now,
        clickedAt: now,
      },
      update: { clickedAt: now },
    });

    return PrismaGeneratedStarterQuestionUsageMapper.toDomain(usage);
  }
}
