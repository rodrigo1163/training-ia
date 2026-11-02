
import {
  DEFAULT_CHAT_MODEL_ID,
} from '@training-ia/contracts';
import {
  ChatModel,
  ChatModelFactory,
  ChatModelUnavailableError,
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
import type { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import type { BotRepository } from '../repositories/bot-repository';
import type {
  ChatRepository,
  CompleteAssistantInput,
  CreateChatTurnInput,
  CreatedChatTurn,
} from '../repositories/chat-repository';
import {
  ConversationBusyError,
  DuplicateChatMessageError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from './errors/public-chat-errors';
import { SendBotMessageUseCase } from './send-bot-message';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

const deploymentId = new UniqueEntityId('deployment-1');
const botId = new UniqueEntityId('bot-1');
const conversationId = new UniqueEntityId('conversation-1');
const origin = 'https://example.com';

function makeBot(documentCount = 0) {
  return Bot.create(
    {
      orgId: new UniqueEntityId('organization-1'),
      name: 'Support bot',
      documentCount,
    },
    botId,
  );
}

function makeDeployment(status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
  return BotDeployment.create(
    {
      botId,
      publicKey: 'public-key',
      status,
      allowedOrigins: [origin],
    },
    deploymentId,
  );
}

function makeConversation() {
  return ChatConversation.create(
    {
      deploymentId,
      origin,
    },
    conversationId,
  );
}

function makeMessage(input: {
  conversationId: UniqueEntityId;
  role: 'USER' | 'ASSISTANT';
  status: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED';
  content?: string;
  clientMessageId?: string;
}) {
  return ChatMessage.create({
    conversationId: input.conversationId,
    role: input.role,
    status: input.status,
    content: input.content,
    clientMessageId: input.clientMessageId,
  });
}

class FakeBotDeploymentRepository implements BotDeploymentRepository {
  deployment: BotDeployment | null = null;

  async findByBotId() {
    return this.deployment;
  }

  async findByPublicKey() {
    return this.deployment;
  }

  async create() { }

  async update() { }
}

class FakeBotRepository implements BotRepository {
  bot: Bot | null = null;

  async create() { }

  async update() { }

  async findManyByOrgId() {
    return this.bot ? [this.bot] : [];
  }

  async findById() {
    return this.bot;
  }

  async findBySlugAndOrgId() {
    return this.bot;
  }

  async deleteIfEmpty() {
    return false;
  }
}

class FakeChatRepository implements ChatRepository {
  conversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  activeAssistant = false;
  createdTurn: CreateChatTurnInput | null = null;
  recentMessagesInput: {
    conversationId: string;
    excludedMessageId: string;
    limit: number;
  } | null = null;
  completedAssistant: CompleteAssistantInput | null = null;
  failedAssistant: {
    assistantMessageId: string;
    code: string;
    message: string;
  } | null = null;

  async findConversationByIdAndDeploymentId() {
    return this.conversation;
  }

  async findMessageByClientMessageId(clientMessageId: string) {
    return (
      this.messages.find(
        (message) => message.clientMessageId === clientMessageId,
      ) ?? null
    );
  }

  async hasActiveAssistant() {
    return this.activeAssistant;
  }

  async createTurn(input: CreateChatTurnInput): Promise<CreatedChatTurn> {
    this.createdTurn = input;
    const conversation =
      this.conversation ??
      ChatConversation.create(
        {
          deploymentId,
          origin: input.origin,
        },
        new UniqueEntityId('new-conversation'),
      );
    const initialAssistantMessage = input.conversationId
      ? null
      : makeMessage({
        conversationId: conversation.id,
        role: 'ASSISTANT',
        status: 'COMPLETED',
        content: input.initialMessage,
      });
    const userMessage = makeMessage({
      conversationId: conversation.id,
      role: 'USER',
      status: 'COMPLETED',
      content: input.content,
      clientMessageId: input.clientMessageId,
    });
    const assistantMessage = makeMessage({
      conversationId: conversation.id,
      role: 'ASSISTANT',
      status: 'PENDING',
    });
    this.conversation = conversation;
    if (initialAssistantMessage) this.messages.push(initialAssistantMessage);
    this.messages.push(userMessage, assistantMessage);
    return {
      conversation,
      initialAssistantMessage,
      userMessage,
      assistantMessage,
    };
  }

  async findRecentCompletedMessages(
    conversationId: string,
    excludedMessageId: string,
    limit: number,
  ) {
    this.recentMessagesInput = {
      conversationId,
      excludedMessageId,
      limit,
    };

    return this.messages
      .filter(
        (message) =>
          message.status === 'COMPLETED' &&
          message.id.toString() !== excludedMessageId,
      )
      .slice(-limit);
  }

  async markAssistantStreaming() { }

  async completeAssistant(input: CompleteAssistantInput) {
    this.completedAssistant = input;
  }

  async failAssistant(
    assistantMessageId: string,
    code: string,
    message: string,
  ) {
    this.failedAssistant = { assistantMessageId, code, message };
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
  constructor(readonly model: string = 'test-model') {
    super();
  }

  messages: ChatPromptMessage[] | null = null;
  chunks: ChatModelChunk[] = [{ content: 'Resposta gerada.' }];
  error: Error | null = null;
  errorAfterChunks: Error | null = null;

  async *stream(messages: ChatPromptMessage[]) {
    this.messages = messages;
    if (this.error) throw this.error;

    for (const chunk of this.chunks) {
      yield chunk;
      if (this.errorAfterChunks) throw this.errorAfterChunks;
    }
  }
}

class FakeChatModelFactory extends ChatModelFactory {
  configs: Array<{
    model: string | null;
    temperature: number | null;
    maxTokens: number | null;
  }> = [];

  models = new Map<string, FakeChatModel>();

  constructor(private readonly chatModel: FakeChatModel) {
    super();
    this.models.set(DEFAULT_CHAT_MODEL_ID, chatModel);
  }

  create(config: ChatGenerationConfig) {
    this.configs.push(config);
    return this.models.get(config.model ?? DEFAULT_CHAT_MODEL_ID) ?? this.chatModel;
  }
}

describe('Send bot message', () => {
  let deployments: FakeBotDeploymentRepository;
  let bots: FakeBotRepository;
  let chats: FakeChatRepository;
  let knowledge: FakeKnowledgeRetriever;
  let chatModel: FakeChatModel;
  let chatModelFactory: FakeChatModelFactory;
  let sut: SendBotMessageUseCase;

  function validRequest() {
    return {
      deploymentKey: 'public-key',
      origin,
      conversationId: undefined as string | undefined,
      clientMessageId: 'client-message-1',
      content: 'Como faÃ§o para solicitar suporte?',
      signal: new AbortController().signal,
    };
  }

  async function collectEvents(input: ReturnType<typeof validRequest>) {
    const result = await sut.execute(input);
    if (result.isLeft()) throw result.value;

    const events = [];
    for await (const event of result.value.events) {
      events.push(event);
    }
    return { result, events };
  }

  beforeEach(() => {
    deployments = new FakeBotDeploymentRepository();
    bots = new FakeBotRepository();
    chats = new FakeChatRepository();
    knowledge = new FakeKnowledgeRetriever();
    chatModel = new FakeChatModel();
    chatModelFactory = new FakeChatModelFactory(chatModel);
    deployments.deployment = makeDeployment();
    bots.bot = makeBot(1);
    sut = new SendBotMessageUseCase(
      deployments,
      bots,
      chats,
      knowledge,
      chatModelFactory,
    );
  });

  it('rejects an inactive deployment', async () => {
    deployments.deployment = makeDeployment('INACTIVE');

    const result = await sut.execute(validRequest());

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');
    expect(result.value).toBeInstanceOf(PublicChatNotFoundError);
  });

  it('rejects a disallowed origin', async () => {
    const result = await sut.execute({
      ...validRequest(),
      origin: 'https://other.example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an origin error');
    expect(result.value).toBeInstanceOf(OriginNotAllowedError);
  });

  it('rejects a conversation that does not belong to the deployment', async () => {
    chats.conversation = null;

    const result = await sut.execute({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a not found error');
    expect(result.value).toBeInstanceOf(PublicChatNotFoundError);
  });

  it('rejects a conversation from another origin', async () => {
    chats.conversation = ChatConversation.create(
      {
        deploymentId,
        origin: 'https://other.example.com',
      },
      conversationId,
    );

    const result = await sut.execute({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected an origin error');
    expect(result.value).toBeInstanceOf(OriginNotAllowedError);
  });

  it('rejects a conversation with an active assistant', async () => {
    chats.conversation = makeConversation();
    chats.activeAssistant = true;

    const result = await sut.execute({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a busy conversation error');
    expect(result.value).toBeInstanceOf(ConversationBusyError);
  });

  it('rejects a duplicated client message', async () => {
    chats.messages.push(
      makeMessage({
        conversationId,
        role: 'USER',
        status: 'COMPLETED',
        clientMessageId: 'client-message-1',
      }),
    );

    const result = await sut.execute(validRequest());

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a duplicate message error');
    expect(result.value).toBeInstanceOf(DuplicateChatMessageError);
  });

  it('streams the response and includes the current question in the prompt', async () => {
    knowledge.chunks = [
      {
        documentId: 'document-1',
        chunkId: 'chunk-1',
        documentName: 'Support guide',
        text: 'O suporte funciona de segunda a sexta.',
        score: 0.95,
      },
    ];

    const { result, events } = await collectEvents(validRequest());

    expect(result.isRight()).toBe(true);
    expect(knowledge.input).toEqual({
      botId: botId.toString(),
      query: 'Como faÃ§o para solicitar suporte?',
      limit: 5,
    });
    expect(chatModel.messages?.at(-1)).toEqual({
      role: 'user',
      content: 'Como faÃ§o para solicitar suporte?',
    });
    expect(events).toEqual([
      expect.objectContaining({ type: 'metadata' }),
      { type: 'delta', data: { content: 'Resposta gerada.' } },
      {
        type: 'completed',
        data: {
          model: 'test-model',
          inputTokens: undefined,
          outputTokens: undefined,
        },
      },
    ]);
    expect(chats.completedAssistant).toMatchObject({
      content: 'Resposta gerada.',
      model: 'test-model',
      citations: [
        {
          documentId: 'document-1',
          chunkId: 'chunk-1',
          documentName: 'Support guide',
          excerpt: 'O suporte funciona de segunda a sexta.',
          position: 0,
          score: 0.95,
        },
      ],
    });
  });

  it('persists the initial assistant message and includes it in the first prompt', async () => {
    const bot = bots.bot!;
    const configError = bot.updateChatConfig({
      initialMessage: 'Bem-vindo ao suporte!',
    });
    expect(configError).toBeNull();

    await collectEvents(validRequest());

    expect(chats.messages.map((message) => ({
      role: message.role,
      status: message.status,
      content: message.content,
    }))).toEqual([
      {
        role: 'ASSISTANT',
        status: 'COMPLETED',
        content: 'Bem-vindo ao suporte!',
      },
      {
        role: 'USER',
        status: 'COMPLETED',
        content: 'Como faÃ§o para solicitar suporte?',
      },
      {
        role: 'ASSISTANT',
        status: 'PENDING',
        content: '',
      },
    ]);
    expect(chatModel.messages).toEqual([
      expect.objectContaining({ role: 'system' }),
      { role: 'assistant', content: 'Bem-vindo ao suporte!' },
      { role: 'user', content: 'Como faÃ§o para solicitar suporte?' },
    ]);
  });

  it('uses the effective default initial message when it is null', async () => {
    await collectEvents(validRequest());

    expect(chats.createdTurn?.initialMessage).toBe(
      'Hello! 👋 How can I help you today?',
    );
    expect(chatModel.messages?.[1]).toEqual({
      role: 'assistant',
      content: 'Hello! 👋 How can I help you today?',
    });
  });

  it('does not duplicate a turn when the client retries the same message id', async () => {
    await collectEvents(validRequest());

    const result = await sut.execute(validRequest());

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a duplicate message error');
    expect(result.value).toBeInstanceOf(DuplicateChatMessageError);
    expect(chats.messages).toHaveLength(3);
  });

  it('does not add an initial assistant message to an existing conversation', async () => {
    chats.conversation = makeConversation();

    await collectEvents({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(chats.messages).not.toContainEqual(
      expect.objectContaining({
        role: 'ASSISTANT',
        content: 'Hello! 👋 How can I help you today?',
      }),
    );
  });

  it('keeps previous messages in history and adds the current question only once', async () => {
    chats.conversation = makeConversation();
    chats.messages.push(
      makeMessage({
        conversationId,
        role: 'USER',
        status: 'COMPLETED',
        content: 'Pergunta anterior',
      }),
      makeMessage({
        conversationId,
        role: 'ASSISTANT',
        status: 'COMPLETED',
        content: 'Resposta anterior',
      }),
    );

    await collectEvents({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(chatModel.messages).toEqual([
      expect.objectContaining({ role: 'system' }),
      { role: 'user', content: 'Pergunta anterior' },
      { role: 'assistant', content: 'Resposta anterior' },
      { role: 'user', content: 'Como faÃ§o para solicitar suporte?' },
    ]);
    expect(
      chatModel.messages?.filter(
        (message) =>
          message.role === 'user' &&
          message.content === 'Como faÃ§o para solicitar suporte?',
      ),
    ).toHaveLength(1);
    expect(chats.recentMessagesInput).toMatchObject({
      conversationId: conversationId.toString(),
      limit: 20,
      excludedMessageId: expect.any(String),
    });
    expect(chats.recentMessagesInput?.excludedMessageId).toBe(
      chats.messages.find(
        (message) => message.clientMessageId === 'client-message-1',
      )?.id.toString(),
    );
  });

  it('applies the history limit after excluding the current question', async () => {
    chats.conversation = makeConversation();
    const previousMessages = Array.from({ length: 21 }, (_, index) =>
      makeMessage({
        conversationId,
        role: index % 2 === 0 ? 'USER' : 'ASSISTANT',
        status: 'COMPLETED',
        content: `Mensagem anterior ${index + 1}`,
      }),
    );
    chats.messages.push(...previousMessages);

    await collectEvents({
      ...validRequest(),
      conversationId: conversationId.toString(),
    });

    expect(chatModel.messages?.slice(1, -1).map((message) => message.content)).toEqual(
      previousMessages.slice(1).map((message) => message.content),
    );
    expect(chatModel.messages?.slice(1, -1)).toHaveLength(20);
    expect(chatModel.messages?.at(-1)).toEqual({
      role: 'user',
      content: 'Como faÃ§o para solicitar suporte?',
    });
  });

  it('creates the initial assistant message only once across turns in a conversation', async () => {
    await collectEvents(validRequest());

    const secondResult = await sut.execute({
      ...validRequest(),
      conversationId: chats.conversation!.id.toString(),
      clientMessageId: 'client-message-2',
      content: 'Tenho outra dúvida.',
    });

    if (secondResult.isLeft()) throw secondResult.value;
    for await (const _event of secondResult.value.events) {
      // Consume the stream so the second turn follows the normal flow.
    }

    expect(
      chats.messages.filter(
        (message) =>
          message.role === 'ASSISTANT' &&
          message.content === 'Hello! 👋 How can I help you today?',
      ),
    ).toHaveLength(1);
  });

  it('passes the bot generation configuration to the model factory', async () => {
    const bot = bots.bot!;
    const configError = bot.updateChatConfig({
      model: 'anthropic/claude-haiku-5.5',
      temperature: 0.4,
      maxTokens: 800,
    });
    expect(configError).toBeNull();

    await collectEvents(validRequest());

    expect(chatModelFactory.configs[0]).toEqual({
      model: 'anthropic/claude-haiku-5.5',
      temperature: 0.4,
      maxTokens: 800,
    });
  });

  it('falls back to the default model when the selected model is unavailable before streaming', async () => {
    const bot = bots.bot!;
    const configError = bot.updateChatConfig({
      model: 'anthropic/claude-haiku-5.5',
    });
    expect(configError).toBeNull();

    const selectedModel = new FakeChatModel('anthropic/claude-haiku-5.5');
    selectedModel.error = new ChatModelUnavailableError(
      'anthropic/claude-haiku-5.5',
      new Error('provider unavailable'),
    );
    const fallbackModel = new FakeChatModel(DEFAULT_CHAT_MODEL_ID);
    fallbackModel.chunks = [{ content: 'Resposta pelo fallback.' }];
    chatModelFactory.models.set(selectedModel.model, selectedModel);
    chatModelFactory.models.set(fallbackModel.model, fallbackModel);

    const { events } = await collectEvents(validRequest());

    expect(chatModelFactory.configs).toEqual([
      {
        model: 'anthropic/claude-haiku-5.5',
        temperature: null,
        maxTokens: null,
      },
      {
        model: DEFAULT_CHAT_MODEL_ID,
        temperature: null,
        maxTokens: null,
      },
    ]);
    expect(events.at(-1)).toEqual({
      type: 'completed',
      data: {
        model: DEFAULT_CHAT_MODEL_ID,
        inputTokens: undefined,
        outputTokens: undefined,
      },
    });
  });

  it('does not fall back for a non-temporary model error', async () => {
    const bot = bots.bot!;
    const configError = bot.updateChatConfig({
      model: 'anthropic/claude-haiku-5.5',
    });
    expect(configError).toBeNull();

    const selectedModel = new FakeChatModel('anthropic/claude-haiku-5.5');
    selectedModel.error = new Error('model rejected the request');
    chatModelFactory.models.set(selectedModel.model, selectedModel);

    const { events } = await collectEvents(validRequest());

    expect(chatModelFactory.configs).toHaveLength(1);
    expect(events.at(-1)).toEqual({
      type: 'error',
      data: {
        code: 'generation_failed',
        message: 'The response could not be generated.',
      },
    });
  });

  it('does not fall back after the selected model emitted a delta', async () => {
    const bot = bots.bot!;
    const configError = bot.updateChatConfig({
      model: 'anthropic/claude-haiku-5.5',
    });
    expect(configError).toBeNull();

    const selectedModel = new FakeChatModel('anthropic/claude-haiku-5.5');
    selectedModel.errorAfterChunks = new ChatModelUnavailableError(
      'anthropic/claude-haiku-5.5',
      new Error('model timed out'),
    );
    chatModelFactory.models.set(selectedModel.model, selectedModel);

    const { events } = await collectEvents(validRequest());

    expect(chatModelFactory.configs).toHaveLength(1);
    expect(events).toEqual([
      expect.objectContaining({ type: 'metadata' }),
      { type: 'delta', data: { content: 'Resposta gerada.' } },
      {
        type: 'error',
        data: {
          code: 'generation_failed',
          message: 'The response could not be generated.',
        },
      },
    ]);
  });

  it('marks the assistant as failed and emits an error when generation fails', async () => {
    chatModel.error = new Error('Provider failed');

    const { events } = await collectEvents(validRequest());

    expect(events).toHaveLength(2);
    expect(events[1]).toEqual({
      type: 'error',
      data: {
        code: 'generation_failed',
        message: 'The response could not be generated.',
      },
    });
    expect(chats.failedAssistant).toEqual({
      assistantMessageId: expect.any(String),
      code: 'generation_failed',
      message: 'The response could not be generated.',
    });
  });

  it('marks the assistant as failed without emitting an error when the client disconnects', async () => {
    const controller = new AbortController();
    const result = await sut.execute({
      ...validRequest(),
      signal: controller.signal,
    });

    if (result.isLeft()) throw result.value;

    const events = [];
    for await (const event of result.value.events) {
      events.push(event);
      if (event.type === 'delta') controller.abort();
    }

    expect(events).toEqual([
      expect.objectContaining({ type: 'metadata' }),
      { type: 'delta', data: { content: 'Resposta gerada.' } },
    ]);
    expect(chats.failedAssistant).toEqual({
      assistantMessageId: expect.any(String),
      code: 'client_disconnected',
      message: 'The client disconnected.',
    });
    expect(chats.completedAssistant).toBeNull();
  });
});
