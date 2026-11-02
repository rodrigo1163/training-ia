import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { GeneratedStarterQuestionRepository } from '@/domain/application/repositories/generated-starter-question-repository';
import { GeneratedStarterQuestionUsageRepository } from '@/domain/application/repositories/generated-starter-question-usage-repository';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotFactory } from '../../../../../test/factories/make-bot';

describe('PrismaGeneratedStarterQuestionUsageRepository (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let botFactory: BotFactory;
  let questions: GeneratedStarterQuestionRepository;
  let usages: GeneratedStarterQuestionUsageRepository;
  let organizationId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    botFactory = moduleRef.get(BotFactory);
    questions = moduleRef.get(GeneratedStarterQuestionRepository);
    usages = moduleRef.get(GeneratedStarterQuestionUsageRepository);
    await app.init();

    organizationId = randomUUID();
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Starter Question Usage E2E Organization',
        slug: `starter-question-usage-${organizationId}`,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('isolates shown and clicked usage by conversation while reusing the catalog question', async () => {
    const bot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
    });
    const deploymentId = randomUUID();
    await prisma.botDeployment.create({
      data: {
        id: deploymentId,
        botId: bot.id.toString(),
        publicKey: `usage-${deploymentId}`,
        allowedOrigins: ['https://example.com'],
      },
    });

    const firstConversationId = randomUUID();
    const secondConversationId = randomUUID();
    await prisma.chatConversation.createMany({
      data: [
        {
          id: firstConversationId,
          deploymentId,
          origin: 'https://example.com',
          lastMessageAt: new Date(),
        },
        {
          id: secondConversationId,
          deploymentId,
          origin: 'https://example.com',
          lastMessageAt: new Date(),
        },
      ],
    });

    const question = await questions.create({
      botId: bot.id.toString(),
      idempotencyKey: `usage-question-${randomUUID()}`,
      originalText: 'Como funciona o suporte?',
      normalizedText: 'como funciona o suporte?',
    });
    if (!question) throw new Error('Expected a generated question.');

    await usages.recordShown({
      generatedStarterQuestionId: question.id.toString(),
      conversationId: firstConversationId,
    });
    await usages.recordClicked({
      generatedStarterQuestionId: question.id.toString(),
      conversationId: firstConversationId,
    });
    const candidatesForSecondConversationBeforeUse =
      await questions.findByBotIdForConversation(
        bot.id.toString(),
        secondConversationId,
      );
    await usages.recordShown({
      generatedStarterQuestionId: question.id.toString(),
      conversationId: secondConversationId,
    });

    const firstConversationUsages = await usages.findByConversationId(
      firstConversationId,
    );
    const secondConversationUsages = await usages.findByConversationId(
      secondConversationId,
    );
    const candidatesForFirstConversation =
      await questions.findByBotIdForConversation(
        bot.id.toString(),
        firstConversationId,
      );
    const candidatesForSecondConversation =
      await questions.findByBotIdForConversation(
        bot.id.toString(),
        secondConversationId,
      );

    expect(firstConversationUsages).toHaveLength(1);
    expect(firstConversationUsages[0]?.clickedAt).not.toBeNull();
    expect(secondConversationUsages).toHaveLength(1);
    expect(candidatesForFirstConversation).toHaveLength(0);
    expect(candidatesForSecondConversationBeforeUse).toHaveLength(1);
    expect(candidatesForSecondConversation).toHaveLength(0);
    await expect(
      prisma.botGeneratedStarterQuestionUsage.count({
        where: { generatedStarterQuestionId: question.id.toString() },
      }),
    ).resolves.toBe(2);
  });
});
