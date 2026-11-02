import type { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';

export interface CreateGeneratedStarterQuestionInput {
  botId: string;
  originalText: string;
  normalizedText: string;
}

export abstract class GeneratedStarterQuestionRepository {
  abstract findByBotId(botId: string): Promise<GeneratedStarterQuestion[]>;
  abstract create(
    input: CreateGeneratedStarterQuestionInput,
  ): Promise<GeneratedStarterQuestion | null>;
  abstract markUsed(id: string): Promise<void>;
}
