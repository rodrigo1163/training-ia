import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotDeployment } from '../../enterprise/entities/bot-deployment';
import { makeBot } from '../../../../test/factories/make-bot';
import { InMemoryBotDeploymentRepository } from '../../../../test/repositories/in-memory-bot-deployment-repository';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { GetPublicChatConfigUseCase } from './get-public-chat-config';
import { ChatConversation } from '../../enterprise/entities/chat-conversation';
import { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';
import type { ChatRepository } from '../repositories/chat-repository';
import { GeneratedStarterQuestionRepository } from '../repositories/generated-starter-question-repository';
import { PublicChatNotFoundError } from './errors/public-chat-errors';

const deploymentId = new UniqueEntityId('deployment-1');
const botId = new UniqueEntityId('bot-1');
const conversationId = new UniqueEntityId('conversation-1');

class FakeChatRepository implements ChatRepository {
  conversation: ChatConversation | null = null;
  findConversationCalls: Array<{ id: string; deploymentId: string }> = [];

  async findConversationByIdAndDeploymentId(id: string, deploymentId: string) {
    this.findConversationCalls.push({ id, deploymentId });

    if (
      !this.conversation ||
      this.conversation.id.toString() !== id ||
      this.conversation.deploymentId.toString() !== deploymentId
    ) {
      return null;
    }

    return this.conversation;
  }

  async findMessageByIdAndConversationId() { return null; }
  async findMessageByClientMessageId() { return null; }
  async hasActiveAssistant() { return false; }
  async createTurn(): Promise<never> {
    throw new Error('Not used by this test.');
  }
  async findRecentCompletedMessages() { return []; }
  async markAssistantStreaming() { }
  async completeAssistant() { }
  async failAssistant() { }
}

class FakeGeneratedStarterQuestionRepository extends GeneratedStarterQuestionRepository {
  questions: GeneratedStarterQuestion[] = [];
  findByBotIdForConversationCalls: Array<{
    botId: string;
    conversationId?: string;
  }> = [];

  async findByBotId() { return this.questions; }
  async findByBotIdForConversation(botId: string, conversationId?: string) {
    this.findByBotIdForConversationCalls.push({ botId, conversationId });
    return this.questions;
  }
  async findByIdempotencyKey() { return null; }
  async create() { return null; }
  async markUsed() { }
}

async function makeTestContext() {
  const bots = new InMemoryBotRepository();
  const deployments = new InMemoryBotDeploymentRepository();
  const chats = new FakeChatRepository();
  const generatedQuestions = new FakeGeneratedStarterQuestionRepository();
  const bot = makeBot(
    { name: 'Support Bot' },
    botId,
  );
  const deployment = BotDeployment.create(
    {
      botId: bot.id,
      publicKey: 'public-key',
      allowedOrigins: ['https://app.example.com'],
    },
    deploymentId,
  );

  await bots.create(bot);
  await deployments.create(deployment);

  return {
    bots,
    deployments,
    chats,
    generatedQuestions,
    bot,
    deployment,
  };
}

function makeUseCase(context: Awaited<ReturnType<typeof makeTestContext>>) {
  return new GetPublicChatConfigUseCase(
    context.deployments,
    context.bots,
    context.chats,
    context.generatedQuestions,
  );
}

describe('Get public chat config', () => {
  it('returns the config without a conversation id', async () => {
    const context = await makeTestContext();
    const chatConfigError = context.bot.updateChatConfig({
      initialMessage: 'Welcome!',
      model: 'private-model',
    });
    expect(chatConfigError).toBeNull();

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bot.chatConfig.initialMessage).toBe('Welcome!');
    expect(result.value.bot.chatConfig.model).toBe('private-model');
    expect(context.chats.findConversationCalls).toEqual([]);
    expect(context.generatedQuestions.findByBotIdForConversationCalls).toEqual([
      { botId: botId.toString(), conversationId: undefined },
    ]);
  });

  it('returns the config when the conversation belongs to the deployment', async () => {
    const context = await makeTestContext();
    context.chats.conversation = ChatConversation.create(
      { deploymentId: context.deployment.id, origin: 'https://app.example.com' },
      conversationId,
    );

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
      conversationId: conversationId.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(context.chats.findConversationCalls).toEqual([
      {
        id: conversationId.toString(),
        deploymentId: context.deployment.id.toString(),
      },
    ]);
    expect(context.generatedQuestions.findByBotIdForConversationCalls).toEqual([
      {
        botId: botId.toString(),
        conversationId: conversationId.toString(),
      },
    ]);
  });

  it('returns PublicChatNotFoundError when the conversation does not exist', async () => {
    const context = await makeTestContext();

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error.');
    expect(result.value).toBeInstanceOf(PublicChatNotFoundError);
    expect(context.generatedQuestions.findByBotIdForConversationCalls).toEqual([]);
  });

  it('returns PublicChatNotFoundError when the conversation belongs to another deployment', async () => {
    const context = await makeTestContext();
    context.chats.conversation = ChatConversation.create(
      {
        deploymentId: new UniqueEntityId('another-deployment'),
        origin: 'https://app.example.com',
      },
      conversationId,
    );

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error.');
    expect(result.value).toBeInstanceOf(PublicChatNotFoundError);
    expect(context.generatedQuestions.findByBotIdForConversationCalls).toEqual([]);
  });

  it('does not use an invalid conversation to filter persisted questions', async () => {
    const context = await makeTestContext();
    context.generatedQuestions.questions = [
      GeneratedStarterQuestion.create({
        botId: context.bot.id,
        idempotencyKey: 'catalog-1',
        originalText: 'Persistida?',
        normalizedText: 'persistida?',
      }),
    ];

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(context.generatedQuestions.findByBotIdForConversationCalls).toHaveLength(0);
  });

  it('prioritizes configured questions and fills the remaining slots from the catalog', async () => {
    const context = await makeTestContext();
    const chatConfigError = context.bot.updateChatConfig({
      starterQuestions: ['Manual?'],
    });
    expect(chatConfigError).toBeNull();
    context.generatedQuestions.questions = [
      GeneratedStarterQuestion.create({
        botId: context.bot.id,
        idempotencyKey: 'catalog-1',
        originalText: 'Manual?',
        normalizedText: 'manual?',
      }),
      GeneratedStarterQuestion.create({
        botId: context.bot.id,
        idempotencyKey: 'catalog-2',
        originalText: 'Gerada?',
        normalizedText: 'gerada?',
      }),
    ];

    const result = await makeUseCase(context).execute({
      deploymentKey: 'public-key',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.starterQuestions).toEqual(['Manual?', 'Gerada?']);
  });
});
