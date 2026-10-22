
import {
  ChatModel,
  type ChatModelChunk,
  type ChatPromptMessage,
} from '../ai/chat-model.js';
import {
  KnowledgeRetriever,
  type KnowledgeChunk,
} from '../ai/knowledge-retriever.js';
import { Bot } from '../../enterprise/entities/bot.js';
import { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import { ChatConversation } from '../../enterprise/entities/chat-conversation.js';
import { ChatMessage } from '../../enterprise/entities/chat-message.js';
import type { BotDeploymentRepository } from '../repositories/bot-deployment-repository.js';
import type { BotRepository } from '../repositories/bot-repository.js';
import type {
  ChatRepository,
  CompleteAssistantInput,
  CreateChatTurnInput,
  CreatedChatTurn,
} from '../repositories/chat-repository.js';
import {
  ConversationBusyError,
  DuplicateChatMessageError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from './errors/public-chat-errors.js';
import { SendBotMessageUseCase } from './send-bot-message.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';

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
    this.messages.push(userMessage, assistantMessage);
    return { conversation, userMessage, assistantMessage };
  }

  async findRecentCompletedMessages() {
    return this.messages.filter((message) => message.status === 'COMPLETED');
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
  readonly model = 'test-model';
  messages: ChatPromptMessage[] | null = null;
  chunks: ChatModelChunk[] = [{ content: 'Resposta gerada.' }];
  error: Error | null = null;

  async *stream(messages: ChatPromptMessage[]) {
    this.messages = messages;
    if (this.error) throw this.error;

    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}

describe('Send bot message', () => {
  let deployments: FakeBotDeploymentRepository;
  let bots: FakeBotRepository;
  let chats: FakeChatRepository;
  let knowledge: FakeKnowledgeRetriever;
  let chatModel: FakeChatModel;
  let sut: SendBotMessageUseCase;

  function validRequest() {
    return {
      deploymentKey: 'public-key',
      origin,
      conversationId: undefined,
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
    deployments.deployment = makeDeployment();
    bots.bot = makeBot(1);
    sut = new SendBotMessageUseCase(
      deployments,
      bots,
      chats,
      knowledge,
      chatModel,
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
});
