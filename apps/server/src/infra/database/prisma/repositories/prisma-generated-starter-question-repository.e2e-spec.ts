import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { GeneratedStarterQuestionRepository } from '@/domain/application/repositories/generated-starter-question-repository';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotFactory } from '../../../../../test/factories/make-bot';

describe('PrismaGeneratedStarterQuestionRepository (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let botFactory: BotFactory;
  let questions: GeneratedStarterQuestionRepository;
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
    await app.init();

    organizationId = randomUUID();
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Generated Starter Question E2E Organization',
        slug: `generated-starter-question-${organizationId}`,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists generated questions and enforces normalized uniqueness per bot', async () => {
    const bot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
    });
    const first = await questions.create({
      botId: bot.id.toString(),
      originalText: 'Qual é o prazo?',
      normalizedText: 'qual é o prazo?',
    });
    const duplicate = await questions.create({
      botId: bot.id.toString(),
      originalText: ' QUAL   É O PRAZO? ',
      normalizedText: 'qual é o prazo?',
    });

    expect(first).not.toBeNull();
    expect(duplicate).toBeNull();
    await expect(
      prisma.botGeneratedStarterQuestion.count({ where: { botId: bot.id.toString() } }),
    ).resolves.toBe(1);
    await expect(questions.findByBotId(bot.id.toString())).resolves.toHaveLength(1);
  });

  it('keeps questions isolated by bot', async () => {
    const firstBot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
    });
    const secondBot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
    });
    const normalizedText = 'qual é o prazo?';

    const firstQuestion = await questions.create({
      botId: firstBot.id.toString(),
      originalText: 'Qual é o prazo?',
      normalizedText,
    });
    const secondBotQuestion = await questions.create({
      botId: secondBot.id.toString(),
      originalText: 'Qual é o prazo?',
      normalizedText,
    });

    expect(secondBotQuestion).not.toBeNull();
    expect(secondBotQuestion?.id.toString()).not.toBe(firstQuestion?.id.toString());
  });
});
import { randomUUID } from 'node:crypto';
