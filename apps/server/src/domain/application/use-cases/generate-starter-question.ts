import { Injectable, Logger } from '@nestjs/common';
import { STARTER_QUESTIONS_MODEL_ID } from '@training-ia/contracts';
import { Either, left, right } from '@/core/either';
import {
  normalizeStarterQuestion,
} from '../../enterprise/entities/generated-starter-question';
import { ChatModelFactory } from '../ai/chat-model';
import { buildStarterQuestionPrompt } from '../ai/starter-question-prompt-builder';
import { KnowledgeRetriever } from '../ai/knowledge-retriever';
import { BotDeploymentRepository } from '../repositories/bot-deployment-repository';
import { BotRepository } from '../repositories/bot-repository';
import { ChatRepository } from '../repositories/chat-repository';
import { GeneratedStarterQuestionRepository } from '../repositories/generated-starter-question-repository';
import {
  InvalidStarterQuestionError,
  OriginNotAllowedError,
  PublicChatNotFoundError,
} from './errors/public-chat-errors';

export type GenerateStarterQuestionError =
  | PublicChatNotFoundError
  | OriginNotAllowedError
  | InvalidStarterQuestionError;

export interface GenerateStarterQuestionOutput {
  question: string | null;
}

interface GenerateStarterQuestionRequest {
  deploymentKey: string;
  origin: string | undefined;
  conversationId: string;
  userMessageId: string;
  slot: number;
  clickedQuestion: string;
  signal: AbortSignal;
}

type GenerateStarterQuestionResponse = Either<
  GenerateStarterQuestionError,
  GenerateStarterQuestionOutput
>;

@Injectable()
export class GenerateStarterQuestionUseCase {
  private readonly logger = new Logger(GenerateStarterQuestionUseCase.name);

  constructor(
    private readonly deployments: BotDeploymentRepository,
    private readonly bots: BotRepository,
    private readonly chats: ChatRepository,
    private readonly generatedQuestions: GeneratedStarterQuestionRepository,
    private readonly knowledge: KnowledgeRetriever,
    private readonly chatModelFactory: ChatModelFactory,
  ) { }

  async execute(
    input: GenerateStarterQuestionRequest,
  ): Promise<GenerateStarterQuestionResponse> {
    const deployment = await this.deployments.findByPublicKey(
      input.deploymentKey,
    );

    if (!deployment || deployment.status !== 'ACTIVE') {
      return left(new PublicChatNotFoundError());
    }

    const normalizedOrigin = this.normalizeOrigin(input.origin);
    if (
      normalizedOrigin === null ||
      !deployment.allowedOrigins.includes(normalizedOrigin)
    ) {
      return left(new OriginNotAllowedError());
    }

    const conversation = await this.chats.findConversationByIdAndDeploymentId(
      input.conversationId,
      deployment.id.toString(),
    );
    if (!conversation) {
      return left(new PublicChatNotFoundError());
    }

    if (conversation.origin !== normalizedOrigin) {
      return left(new OriginNotAllowedError());
    }

    const bot = await this.bots.findById(deployment.botId.toString());
    if (!bot) {
      return left(new PublicChatNotFoundError());
    }

    if (!Number.isInteger(input.slot) || input.slot < 0 || input.slot > 2) {
      return left(new InvalidStarterQuestionError());
    }

    const clickedQuestion = normalizeStarterQuestion(input.clickedQuestion);
    const configuredQuestion = bot.chatConfig.starterQuestions[input.slot];
    const generatedQuestions = await this.generatedQuestions.findByBotId(
      bot.id.toString(),
    );
    const isConfiguredQuestion =
      configuredQuestion !== undefined &&
      normalizeStarterQuestion(configuredQuestion) === clickedQuestion;
    const isGeneratedQuestion = generatedQuestions.some(
      (question) => question.normalizedText === clickedQuestion,
    );
    if (!isConfiguredQuestion && !isGeneratedQuestion) {
      return left(new InvalidStarterQuestionError());
    }

    const userMessage = await this.chats.findMessageByIdAndConversationId(
      input.userMessageId,
      input.conversationId,
    );
    if (
      !userMessage ||
      userMessage.role !== 'USER' ||
      userMessage.status !== 'COMPLETED' ||
      normalizeStarterQuestion(userMessage.content) !==
        normalizeStarterQuestion(input.clickedQuestion)
    ) {
      return left(new InvalidStarterQuestionError());
    }

    if (!bot.chatConfig.generateStarterQuestionsAfterResponse) {
      return right({ question: null });
    }

    const [historyWithCurrent, knowledge] = await Promise.all([
      this.chats.findRecentCompletedMessages(
        input.conversationId,
        input.userMessageId,
        20,
      ),
      bot.documentCount > 0
        ? this.knowledge.retrieve({
          botId: bot.id.toString(),
          query: input.clickedQuestion,
          limit: 5,
        })
        : Promise.resolve([]),
    ]);
    const history = historyWithCurrent.filter(
      (message) => message.id.toString() !== input.userMessageId,
    );

    if (input.signal.aborted) {
      throw new DOMException('The client disconnected.', 'AbortError');
    }

    const usedQuestions = [
      ...bot.chatConfig.starterQuestions,
      ...history
        .filter((message) => message.role === 'USER')
        .map((message) => message.content),
      ...generatedQuestions.map((question) => question.originalText),
      input.clickedQuestion,
    ];
    const prompt = buildStarterQuestionPrompt({
      bot,
      clickedQuestion: input.clickedQuestion,
      history,
      knowledge,
      usedQuestions,
    });
    const model = this.chatModelFactory.create({
      model: STARTER_QUESTIONS_MODEL_ID,
      temperature: 0.7,
      maxTokens: 120,
    });
    let content = '';

    try {
      for await (const chunk of model.stream(prompt, { signal: input.signal })) {
        content += chunk.content;
      }
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'starter_question_generation_failed',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      throw error;
    }

    const question = parseGeneratedQuestion(content);
    if (!question) {
      return right({ question: null });
    }

    const normalizedText = normalizeStarterQuestion(question);
    const usedQuestionSet = new Set(
      usedQuestions.map(normalizeStarterQuestion),
    );
    if (usedQuestionSet.has(normalizedText)) {
      return right({ question: null });
    }

    const persisted = await this.generatedQuestions.create({
      botId: bot.id.toString(),
      originalText: question,
      normalizedText,
    });

    return right({ question: persisted?.originalText ?? null });
  }

  private normalizeOrigin(origin: string | undefined): string | null {
    if (!origin) return null;

    try {
      const url = new URL(origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
    } catch {
      return null;
    }
  }
}

function parseGeneratedQuestion(content: string): string | null {
  let question = content
    .replaceAll('```', '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';

  question = question
    .replace(/^(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!question) return null;

  const questionMark = question.indexOf('?');
  question = questionMark >= 0
    ? question.slice(0, questionMark + 1).trim()
    : `${question.replace(/[.!]+$/, '')}?`;

  if (question.length < 3 || question.length > 120) return null;

  return question;
}
