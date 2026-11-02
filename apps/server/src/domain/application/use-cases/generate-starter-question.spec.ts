import { STARTER_QUESTIONS_MODEL_ID } from '@training-ia/contracts';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import {
  ChatModel,
  ChatModelFactory,
  type ChatGenerationConfig,
  type ChatModelChunk,
  type ChatPromptMessage,
} from '../ai/chat-model';
import {
  KnowledgeRetriever,
  type KnowledgeChunk,
} from '../ai/knowledge-retriever';
import { Bot } from '../../enterprise/entities/bot';
import { BotDeployment } from '../../enterprise/entities/bot-deployment';
import { ChatConversation } from '../../enterprise/entities/chat-conversation';
import { ChatMessage } from '../../enterprise/entities/chat-message';
import {
  GeneratedStarterQuestion,
  normalizeStarterQuestion,
} from '../../enterprise/entities/generated-starter-question';
import { GeneratedStarterQuestionUsage } from '../../enterprise/entities/generated-starter-question-usage';
import type { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import type { BotRepository } from '../repositories/bot-repository';
import type {
  ChatRepository,
  CompleteAssistantInput,
  CreateChatTurnInput,
  CreatedChatTurn,
} from '../repositories/chat-repository';
import {
  GeneratedStarterQuestionRepository,
  type CreateGeneratedStarterQuestionInput,
} from '../repositories/generated-starter-question-repository';
import { GeneratedStarterQuestionUsageRepository } from '../repositories/generated-starter-question-usage-repository';
import {
  createStarterQuestionIdempotencyKey,
  GenerateStarterQuestionUseCase,
} from './generate-starter-question';
import {
  InvalidStarterQuestionError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from './errors/public-chat-errors';

const botId = new UniqueEntityId('bot-1');
const deploymentId = new UniqueEntityId('deployment-1');
const conversationId = new UniqueEntityId('conversation-1');
const currentMessageId = new UniqueEntityId('message-1');
const origin = 'https://example.com';

function makeBot(documentCount = 1) {
  const bot = Bot.create(
    {
      orgId: new UniqueEntityId('organization-1'),
      name: 'Support bot',
      documentCount,
    },
    botId,
  );
  bot.updateChatConfig({
    starterQuestions: ['Como funciona?', 'O que posso fazer?'],
    generateStarterQuestionsAfterResponse: true,
  });
  return bot;
}

function makeMessage(input: {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
}) {
  return ChatMessage.create(
    {
      conversationId,
      role: input.role,
      status: 'COMPLETED',
      content: input.content,
    },
    new UniqueEntityId(input.id),
  );
}

class FakeDeploymentRepository implements BotDeploymentRepository {
  deployment: BotDeployment | null = BotDeployment.create({
    botId,
    publicKey: 'public-key',
    allowedOrigins: [origin],
  }, deploymentId);

  async findByBotId() { return this.deployment; }
  async findByPublicKey() { return this.deployment; }
  async create() { }
  async update() { }
}

class FakeBotRepository implements BotRepository {
  bot: Bot | null = makeBot();

  async create() { }
  async update() { }
  async findManyByOrgId() { return this.bot ? [this.bot] : []; }
  async findById() { return this.bot; }
  async findBySlugAndOrgId() { return this.bot; }
  async deleteIfEmpty() { return false; }
}

class FakeChatRepository implements ChatRepository {
  conversation: ChatConversation | null = ChatConversation.create(
    { deploymentId, origin },
    conversationId,
  );
  currentMessage = makeMessage({
    id: currentMessageId.toString(),
    role: 'USER',
    content: 'Como funciona?',
  });
  history = [
    makeMessage({
      id: 'previous-user',
      role: 'USER',
      content: 'Quais são os horários?',
    }),
    makeMessage({
      id: 'previous-assistant',
      role: 'ASSISTANT',
      content: 'Atendemos em horário comercial.',
    }),
  ];
  recentMessagesInput: {
    conversationId: string;
    excludedMessageId: string;
    limit: number;
  } | null = null;

  async findConversationByIdAndDeploymentId() { return this.conversation; }

  async findMessageByIdAndConversationId(id: string, conversationIdValue: string) {
    return id === currentMessageId.toString() &&
      conversationIdValue === conversationId.toString()
      ? this.currentMessage
      : null;
  }

  async findMessageByClientMessageId() { return null; }
  async hasActiveAssistant() { return false; }
  async createTurn(_input: CreateChatTurnInput): Promise<CreatedChatTurn> {
    throw new Error('Not used by this test.');
  }

  async findRecentCompletedMessages(
    conversationIdValue: string,
    excludedMessageId: string,
    limit: number,
  ) {
    this.recentMessagesInput = {
      conversationId: conversationIdValue,
      excludedMessageId,
      limit,
    };
    return this.history;
  }

  async markAssistantStreaming() { }
  async completeAssistant(_input: CompleteAssistantInput) { }
  async failAssistant() { }
}

class FakeGeneratedQuestionRepository extends GeneratedStarterQuestionRepository {
  questions: GeneratedStarterQuestion[] = [];
  created: CreateGeneratedStarterQuestionInput[] = [];

  async findByBotId() { return this.questions; }

  async findByBotIdForConversation() { return this.questions; }

  async findByIdempotencyKey(_botId: string, idempotencyKey: string) {
    return this.questions.find(
      (question) => question.idempotencyKey === idempotencyKey,
    ) ?? null;
  }

  async create(input: CreateGeneratedStarterQuestionInput) {
    this.created.push(input);
    if (this.questions.some((question) => question.normalizedText === input.normalizedText)) {
      return null;
    }

    const question = GeneratedStarterQuestion.create({
      botId: new UniqueEntityId(input.botId),
      idempotencyKey: input.idempotencyKey,
      originalText: input.originalText,
      normalizedText: input.normalizedText,
    });
    this.questions.push(question);
    return question;
  }

  async markUsed() { }
}

class FakeGeneratedQuestionUsageRepository extends GeneratedStarterQuestionUsageRepository {
  usages: GeneratedStarterQuestionUsage[] = [];

  async findByConversationId(conversationId: string) {
    return this.usages.filter(
      (usage) => usage.conversationId.toString() === conversationId,
    );
  }

  async recordShown(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }) {
    const existing = this.usages.find(
      (usage) =>
        usage.generatedStarterQuestionId.toString() ===
          input.generatedStarterQuestionId &&
        usage.conversationId.toString() === input.conversationId,
    );
    if (existing) return existing;

    const usage = GeneratedStarterQuestionUsage.create({
      generatedStarterQuestionId: new UniqueEntityId(
        input.generatedStarterQuestionId,
      ),
      conversationId: new UniqueEntityId(input.conversationId),
    });
    this.usages.push(usage);
    return usage;
  }

  async recordClicked(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }) {
    const usage = await this.recordShown(input);
    usage.markClicked();
    return usage;
  }
}

class FakeKnowledgeRetriever extends KnowledgeRetriever {
  input: { botId: string; query: string; limit?: number } | null = null;
  chunks: KnowledgeChunk[] = [];

  async retrieve(input: { botId: string; query: string; limit?: number }) {
    this.input = input;
    return this.chunks;
  }
}

class FakeChatModel extends ChatModel {
  readonly model = STARTER_QUESTIONS_MODEL_ID;
  chunks: ChatModelChunk[] = [{ content: 'Qual é o prazo de atendimento?' }];
  messages: ChatPromptMessage[] | null = null;
  streamCalls = 0;

  async *stream(messages: ChatPromptMessage[]) {
    this.messages = messages;
    this.streamCalls += 1;
    for (const chunk of this.chunks) yield chunk;
  }
}

class FakeChatModelFactory extends ChatModelFactory {
  configs: ChatGenerationConfig[] = [];

  constructor(private readonly model: FakeChatModel) { super(); }

  create(config: ChatGenerationConfig) {
    this.configs.push(config);
    return this.model;
  }
}

describe('Generate starter question', () => {
  let deployments: FakeDeploymentRepository;
  let bots: FakeBotRepository;
  let chats: FakeChatRepository;
  let generatedQuestions: FakeGeneratedQuestionRepository;
  let questionUsages: FakeGeneratedQuestionUsageRepository;
  let knowledge: FakeKnowledgeRetriever;
  let model: FakeChatModel;
  let modelFactory: FakeChatModelFactory;
  let sut: GenerateStarterQuestionUseCase;

  function validRequest() {
    return {
      deploymentKey: 'public-key',
      origin,
      conversationId: conversationId.toString(),
      userMessageId: currentMessageId.toString(),
      slot: 0,
      clickedQuestion: ' Como   funciona? ',
      signal: new AbortController().signal,
    };
  }

  beforeEach(() => {
    deployments = new FakeDeploymentRepository();
    bots = new FakeBotRepository();
    chats = new FakeChatRepository();
    generatedQuestions = new FakeGeneratedQuestionRepository();
    questionUsages = new FakeGeneratedQuestionUsageRepository();
    knowledge = new FakeKnowledgeRetriever();
    knowledge.chunks = [{
      documentId: 'document-1',
      chunkId: 'chunk-1',
      documentName: 'Support guide',
      text: 'O atendimento ocorre de segunda a sexta.',
      score: 0.9,
    }];
    model = new FakeChatModel();
    modelFactory = new FakeChatModelFactory(model);
    sut = new GenerateStarterQuestionUseCase(
      deployments,
      bots,
      chats,
      generatedQuestions,
      questionUsages,
      knowledge,
      modelFactory,
    );
  });

  it('uses the clicked question, history, documents, and the secondary model', async () => {
    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.question).toBe('Qual é o prazo de atendimento?');
    expect(knowledge.input).toEqual({
      botId: botId.toString(),
      query: ' Como   funciona? ',
      limit: 5,
    });
    expect(modelFactory.configs).toEqual([{
      model: STARTER_QUESTIONS_MODEL_ID,
      temperature: 0.7,
      maxTokens: 120,
    }]);
    expect(model.streamCalls).toBe(1);
    expect(model.messages).toEqual([
      expect.objectContaining({ role: 'system' }),
      { role: 'user', content: 'Quais são os horários?' },
      { role: 'assistant', content: 'Atendemos em horário comercial.' },
      { role: 'user', content: ' Como   funciona? ' },
    ]);
    expect(model.messages?.[0]?.content).toContain(
      'O atendimento ocorre de segunda a sexta.',
    );
    expect(model.messages?.[0]?.content).toContain('Como funciona?');
    expect(generatedQuestions.created).toEqual([{
      botId: botId.toString(),
      idempotencyKey: createStarterQuestionIdempotencyKey({
        botId: botId.toString(),
        conversationId: conversationId.toString(),
        userMessageId: currentMessageId.toString(),
        slot: 0,
      }),
      originalText: 'Qual é o prazo de atendimento?',
      normalizedText: normalizeStarterQuestion('Qual é o prazo de atendimento?'),
    }]);
  });

  it('returns the persisted question without generating it again for the same request', async () => {
    const first = await sut.execute(validRequest());
    const second = await sut.execute(validRequest());

    expect(first.isRight()).toBe(true);
    expect(second.isRight()).toBe(true);
    if (second.isLeft()) throw second.value;
    expect(second.value.question).toBe('Qual é o prazo de atendimento?');
    expect(model.streamCalls).toBe(1);
    expect(generatedQuestions.created).toHaveLength(1);
  });

  it('creates different idempotency keys for different messages or slots', () => {
    const first = createStarterQuestionIdempotencyKey({
      botId: botId.toString(),
      conversationId: 'conversation-1',
      userMessageId: 'message-1',
      slot: 0,
    });
    const otherMessage = createStarterQuestionIdempotencyKey({
      botId: botId.toString(),
      conversationId: 'conversation-1',
      userMessageId: 'message-2',
      slot: 0,
    });
    const otherSlot = createStarterQuestionIdempotencyKey({
      botId: botId.toString(),
      conversationId: 'conversation-1',
      userMessageId: 'message-1',
      slot: 1,
    });

    expect(new Set([first, otherMessage, otherSlot]).size).toBe(3);
  });

  it('does not persist or return a duplicate after normalization', async () => {
    generatedQuestions.questions.push(
      GeneratedStarterQuestion.create({
        botId,
        idempotencyKey: 'existing-question',
        originalText: 'Qual é o prazo de atendimento?',
        normalizedText: normalizeStarterQuestion('Qual é o prazo de atendimento?'),
      }),
    );
    model.chunks = [{ content: '  QUAL   É O PRAZO DE ATENDIMENTO?  ' }];

    const result = await sut.execute(validRequest());

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.question).toBeNull();
    expect(generatedQuestions.created).toHaveLength(0);
  });

  it('rejects invalid deployment, origin, conversation, and slot requests', async () => {
    deployments.deployment = null;
    const missingDeployment = await sut.execute(validRequest());
    expect(missingDeployment.value).toBeInstanceOf(PublicChatNotFoundError);

    deployments.deployment = new FakeDeploymentRepository().deployment;
    const wrongOrigin = await sut.execute({
      ...validRequest(),
      origin: 'https://other.example.com',
    });
    expect(wrongOrigin.value).toBeInstanceOf(OriginNotAllowedError);

    chats.conversation = null;
    const missingConversation = await sut.execute(validRequest());
    expect(missingConversation.value).toBeInstanceOf(PublicChatNotFoundError);

    chats.conversation = ChatConversation.create(
      { deploymentId, origin },
      conversationId,
    );
    const invalidSlot = await sut.execute({
      ...validRequest(),
      slot: 3,
    });
    expect(invalidSlot.value).toBeInstanceOf(InvalidStarterQuestionError);
  });

  it('does not generate when the request is for a free-form message', async () => {
    const result = await sut.execute({
      ...validRequest(),
      clickedQuestion: 'Uma pergunta digitada livremente',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidStarterQuestionError);
    expect(model.streamCalls).toBe(0);
  });
});
