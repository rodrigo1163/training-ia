export const MAX_STARTER_QUESTION_LENGTH = 120;

export function normalizeStarterQuestion(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
