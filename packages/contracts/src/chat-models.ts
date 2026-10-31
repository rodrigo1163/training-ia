export const CHAT_MODEL_CATALOG = [
  {
    id: 'anthropic/claude-sonnet-4.6',
    label: 'Claude Sonnet 4.6',
    purpose: 'chat',
    isDefault: true,
    supportsTemperature: true,
    supportsMaxTokens: true,
    maxTokens: null,
    defaultTemperature: null,
    defaultMaxTokens: null,
  },
  {
    id: 'anthropic/claude-haiku-5.5',
    label: 'Claude Haiku 5.5',
    purpose: 'suggestions',
    isDefault: false,
    supportsTemperature: true,
    supportsMaxTokens: true,
    maxTokens: null,
    defaultTemperature: null,
    defaultMaxTokens: null,
  },
] as const satisfies readonly ChatModelDefinition[];

export type ChatModelDefinition = {
  id: string;
  label: string;
  purpose: 'chat' | 'suggestions';
  isDefault: boolean;
  supportsTemperature: boolean;
  supportsMaxTokens: boolean;
  maxTokens: number | null;
  defaultTemperature: number | null;
  defaultMaxTokens: number | null;
};

export type ChatModelId = (typeof CHAT_MODEL_CATALOG)[number]['id'];

export const DEFAULT_CHAT_MODEL_ID = CHAT_MODEL_CATALOG.find(
  (model) => model.isDefault,
)!.id;

export const STARTER_QUESTIONS_MODEL_ID = CHAT_MODEL_CATALOG.find(
  (model) => model.purpose === 'suggestions',
)!.id;

export function getChatModelDefinition(
  id: string,
): ChatModelDefinition | undefined {
  return CHAT_MODEL_CATALOG.find((model) => model.id === id);
}

export function isChatModelId(value: string): value is ChatModelId {
  return getChatModelDefinition(value) !== undefined;
}
