import type { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';
import { normalizeStarterQuestion } from '../../enterprise/entities/generated-starter-question';

export function selectStarterQuestions(input: {
  configuredQuestions: string[];
  generatedQuestions: GeneratedStarterQuestion[];
  limit?: number;
}): string[] {
  const limit = input.limit ?? 3;
  const selected = input.configuredQuestions.slice(0, limit);
  const selectedQuestionSet = new Set(selected.map(normalizeStarterQuestion));

  for (const question of input.generatedQuestions) {
    if (selected.length >= limit) break;
    if (selectedQuestionSet.has(question.normalizedText)) continue;

    selected.push(question.originalText);
    selectedQuestionSet.add(question.normalizedText);
  }

  return selected;
}
