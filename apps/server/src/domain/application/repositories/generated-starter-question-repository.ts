import type { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';

export interface CreateGeneratedStarterQuestionInput {
  botId: string;
  idempotencyKey: string;
  originalText: string;
  normalizedText: string;
}

export abstract class GeneratedStarterQuestionRepository {
  abstract findByBotId(botId: string): Promise<GeneratedStarterQuestion[]>;
  abstract findByBotIdForConversation(
    botId: string,
    conversationId?: string,
  ): Promise<GeneratedStarterQuestion[]>;
  abstract findByIdempotencyKey(
    botId: string,
    idempotencyKey: string,
  ): Promise<GeneratedStarterQuestion | null>;
  abstract create(
    input: CreateGeneratedStarterQuestionInput,
  ): Promise<GeneratedStarterQuestion | null>;
  abstract markUsed(id: string): Promise<void>;
}
