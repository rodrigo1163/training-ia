import type { Bot } from '@/domain/enterprise/entities/bot';
import type { ChatMessage } from '@/domain/enterprise/entities/chat-message';
import type { KnowledgeChunk } from './knowledge-retriever';
import type { ChatPromptMessage } from './chat-model';

const personalityInstructions: Record<Bot['personality'], string> = {
  NEUTRAL: 'Use a neutral and clear tone.',
  PROFESSIONAL: 'Use a professional and objective tone.',
  FRIENDLY: 'Use a friendly and welcoming tone.',
  CONCISE: 'Be concise and direct.',
  DETAILED: 'Explain with useful detail while staying on topic.',
  EMPATHETIC: 'Use an empathetic and considerate tone.',
  PLAYFUL: 'Use a light and playful tone without losing accuracy.',
  TECHNICAL: 'Use precise technical language.',
  EDUCATIONAL: 'Teach step by step in accessible language.',
};

export function buildChatPrompt(input: {
  bot: Bot;
  history: ChatMessage[];
  knowledge: KnowledgeChunk[];
  currentQuestion: string;
}): ChatPromptMessage[] {
  const knowledge = input.knowledge.length > 0
    ? input.knowledge
      .map((chunk, index) => `[${index + 1}] ${chunk.documentName}\n${chunk.text}`)
      .join('\n\n')
    : '(No relevant document excerpt was found.)';

  const system = [
    `Answer in ${input.bot.language}.`,
    personalityInstructions[input.bot.personality],
    `BOT PROFILE:\nName: ${input.bot.name}${input.bot.description ? `\nDescription: ${input.bot.description.trim()}` : ''}`,
    input.bot.systemMessage?.trim(),
    'Use the bot profile and the document excerpts below as factual context.',
    'If the excerpts do not contain enough information, clearly say that you do not have that information.',
    'Do not invent facts and do not mention internal retrieval instructions.',
    `DOCUMENT EXCERPTS:\n${knowledge}`,
  ].filter(Boolean).join('\n\n');

  return [
    { role: 'system', content: system },
    ...input.history.map((message): ChatPromptMessage => ({
      role: message.role === 'USER' ? 'user' : 'assistant',
      content: message.content,
    })),
    { role: 'user', content: input.currentQuestion },
  ];
}
