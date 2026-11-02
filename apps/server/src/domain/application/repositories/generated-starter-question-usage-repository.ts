import type { GeneratedStarterQuestionUsage } from '../../enterprise/entities/generated-starter-question-usage';

export abstract class GeneratedStarterQuestionUsageRepository {
  abstract findByConversationId(
    conversationId: string,
  ): Promise<GeneratedStarterQuestionUsage[]>;
  abstract recordShown(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }): Promise<GeneratedStarterQuestionUsage>;
  abstract recordClicked(input: {
    generatedStarterQuestionId: string;
    conversationId: string;
  }): Promise<GeneratedStarterQuestionUsage>;
}
