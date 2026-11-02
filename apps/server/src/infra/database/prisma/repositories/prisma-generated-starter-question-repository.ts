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

  async create(
    input: CreateGeneratedStarterQuestionInput,
  ): Promise<GeneratedStarterQuestion | null> {
    try {
      const question = await this.prisma.botGeneratedStarterQuestion.create({
        data: {
          id: randomUUID(),
          botId: input.botId,
          originalText: input.originalText,
          normalizedText: input.normalizedText,
        },
      });

      return PrismaGeneratedStarterQuestionMapper.toDomain(question);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
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
