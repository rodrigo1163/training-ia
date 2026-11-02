import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { createDefaultChatConfig } from '@/domain/enterprise/entities/chat-config';
import { ChatRepository } from '@/domain/application/repositories/chat-repository';
import {
  ChatConversationMessageLimitReachedError,
  ChatDailyMessageLimitReachedError,
} from '@/domain/application/use-cases/errors/public-chat-errors';
import { BotFactory } from '../../../../../test/factories/make-bot';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('PrismaChatRepository (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let botFactory: BotFactory;
  let chats: ChatRepository;
  let organizationId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    botFactory = moduleRef.get(BotFactory);
    chats = moduleRef.get(ChatRepository);

    await app.init();

    organizationId = randomUUID();
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Chat Repository E2E Organization',
        slug: `chat-repository-${organizationId}`,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function makeLimitedDeployment(input: {
    dailyLimit: number | null;
    conversationLimit: number | null;
  }) {
    const bot = await botFactory.makePrismaBot({
      orgId: new UniqueEntityId(organizationId),
      chatConfig: {
        ...createDefaultChatConfig(),
        maxMessagesPerDay: input.dailyLimit,
        maxUserMessagesPerConversation: input.conversationLimit,
      },
    });
    const deploymentKey = `chat-repository-${randomUUID()}`;
    const deploymentId = randomUUID();

    await prisma.botDeployment.create({
      data: {
        id: deploymentId,
        botId: bot.id.toString(),
        publicKey: deploymentKey,
        allowedOrigins: ['https://e2e.example.com'],
      },
    });

    return {
      botId: bot.id.toString(),
      deploymentId,
    };
  }

  function turnInput(input: {
    botId: string;
    deploymentId: string;
    clientMessageId: string;
    conversationId?: string;
    initialMessage?: string;
    dailyLimit: number | null;
    conversationLimit: number | null;
  }) {
    return {
      botId: input.botId,
      deploymentId: input.deploymentId,
      conversationId: input.conversationId,
      origin: 'https://e2e.example.com',
      clientMessageId: input.clientMessageId,
      content: 'Mensagem de teste',
      initialMessage: input.initialMessage ?? 'Hello! 👋 How can I help you today?',
      maxMessagesPerDay: input.dailyLimit,
      maxUserMessagesPerConversation: input.conversationLimit,
    };
  }

  it('reserves the daily limit atomically for concurrent new conversations', async () => {
    const deployment = await makeLimitedDeployment({
      dailyLimit: 1,
      conversationLimit: null,
    });

    const results = await Promise.allSettled([
      chats.createTurn(turnInput({
        ...deployment,
        clientMessageId: randomUUID(),
        dailyLimit: 1,
        conversationLimit: null,
      })),
      chats.createTurn(turnInput({
        ...deployment,
        clientMessageId: randomUUID(),
        dailyLimit: 1,
        conversationLimit: null,
      })),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(
      ChatDailyMessageLimitReachedError,
    );

    await expect(
      prisma.chatMessage.count({
        where: {
          conversation: { deploymentId: deployment.deploymentId },
          role: 'USER',
        },
      }),
    ).resolves.toBe(1);
  });

  it('rejects the next accepted user message when a conversation limit is reached', async () => {
    const deployment = await makeLimitedDeployment({
      dailyLimit: null,
      conversationLimit: 1,
    });
    const firstTurn = await chats.createTurn(turnInput({
      ...deployment,
      clientMessageId: randomUUID(),
      dailyLimit: null,
      conversationLimit: 1,
    }));

    await expect(
      chats.createTurn(turnInput({
        ...deployment,
        clientMessageId: randomUUID(),
        conversationId: firstTurn.conversation.id.toString(),
        dailyLimit: null,
        conversationLimit: 1,
      })),
    ).rejects.toBeInstanceOf(ChatConversationMessageLimitReachedError);

    await expect(
      prisma.chatMessage.count({
        where: {
          conversationId: firstTurn.conversation.id.toString(),
          role: 'USER',
        },
      }),
    ).resolves.toBe(1);
  });

  it('persists the initial assistant message without consuming the user message limit', async () => {
    const deployment = await makeLimitedDeployment({
      dailyLimit: 1,
      conversationLimit: 1,
    });
    const turn = await chats.createTurn(turnInput({
      ...deployment,
      clientMessageId: randomUUID(),
      initialMessage: 'Bem-vindo!',
      dailyLimit: 1,
      conversationLimit: 1,
    }));

    await expect(
      prisma.chatConversation.findUnique({
        where: { id: turn.conversation.id.toString() },
      }),
    ).resolves.toMatchObject({ userMessageCount: 1 });

    await expect(
      prisma.chatMessage.findMany({
        where: { conversationId: turn.conversation.id.toString() },
        orderBy: { createdAt: 'asc' },
      }),
    ).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: 'ASSISTANT',
        status: 'COMPLETED',
        content: 'Bem-vindo!',
        clientMessageId: null,
      }),
      expect.objectContaining({
        role: 'USER',
        status: 'COMPLETED',
        content: 'Mensagem de teste',
      }),
      expect.objectContaining({
        role: 'ASSISTANT',
        status: 'PENDING',
        content: '',
      }),
    ]));
  });
});
