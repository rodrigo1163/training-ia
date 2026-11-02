import type { Bot } from '@/domain/enterprise/entities/bot';
import type { ChatMessage } from '@/domain/enterprise/entities/chat-message';
import type { ChatPromptMessage } from './chat-model';
import type { KnowledgeChunk } from './knowledge-retriever';

export function buildStarterQuestionPrompt(input: {
  bot: Bot;
  clickedQuestion: string;
  history: ChatMessage[];
  knowledge: KnowledgeChunk[];
  usedQuestions: string[];
}): ChatPromptMessage[] {
  const documents = input.knowledge.length > 0
    ? input.knowledge
      .map((chunk, index) => `[${index + 1}] ${chunk.documentName}\n${chunk.text}`)
      .join('\n\n')
    : '(No relevant document excerpt was found.)';
  const usedQuestions = input.usedQuestions.length > 0
    ? input.usedQuestions.map((question) => `- ${question}`).join('\n')
    : '(None)';

  const system = [
    `Generate exactly one short follow-up starter question in ${input.bot.language}.`,
    'Return only the question text, with no numbering, quotes, explanation, or preamble.',
    'The output must be a single question and must be at most 120 characters.',
    'Do not repeat any question from the used-question list after trimming, lowercasing, and normalizing spaces.',
    `BOT PROFILE:\nName: ${input.bot.name}${input.bot.description ? `\nDescription: ${input.bot.description.trim()}` : ''}`,
    input.bot.systemMessage?.trim(),
    `USED QUESTIONS:\n${usedQuestions}`,
    `DOCUMENT EXCERPTS:\n${documents}`,
  ].filter(Boolean).join('\n\n');

  return [
    { role: 'system', content: system },
    ...input.history.map((message): ChatPromptMessage => ({
      role: message.role === 'USER' ? 'user' : 'assistant',
      content: message.content,
    })),
    { role: 'user', content: input.clickedQuestion },
  ];
}
