import type { ChatModelId } from "@training-ia/contracts";

export const botPersonalities = [
  "NEUTRAL",
  "PROFESSIONAL",
  "FRIENDLY",
  "CONCISE",
  "DETAILED",
  "EMPATHETIC",
  "PLAYFUL",
  "TECHNICAL",
  "EDUCATIONAL",
] as const;

export const botLanguages = ["pt-BR"] as const;

export type BotPersonality = (typeof botPersonalities)[number];

export type Bot = {
  id: string;
  name: string;
  description: string | null;
  personality: BotPersonality;
  language: string;
  systemMessage: string | null;
  chatConfig: ChatConfig;
  style: BotStyle;
  slug: string;
  documentCount: number;
  createdAt: string;
};

export type ChatConfig = {
  inputPlaceholder: string | null;
  submitButtonText: string | null;
  showMessageTimestamps: boolean;
  starterQuestions: string[];
  generateStarterQuestionsAfterResponse: boolean;
  initialMessage: string | null;
  headerStatusText: string | null;
  model: ChatModelId | null;
  temperature: number | null;
  maxTokens: number | null;
  maxMessagesPerDay: number | null;
  maxUserMessagesPerConversation: number | null;
};

export type ChatTheme = "light" | "dark";

export type ChatColorPalette = {
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  footerBackgroundColor: string | null;
  inputBackgroundColor: string | null;
  inputTextColor: string | null;
  starterQuestionsTextColor: string | null;
  assistantMessageBackgroundColor: string | null;
  assistantMessageTextColor: string | null;
  userMessageBackgroundColor: string | null;
  userMessageTextColor: string | null;
  launcherBackgroundColor: string | null;
  chatBorderColor: string | null;
};

export type BotStyle = {
  colors: Record<ChatTheme, ChatColorPalette>;
  avatarUrl: string | null;
  launcherSize: number | null;
  launcherIcon: "chat" | "bot" | "sparkles" | "avatar" | null;
  chatBorderWidth: number | null;
  chatFontFamily: "sans" | "serif" | "mono" | null;
  chatMessageFontSize: "sm" | "md" | "lg" | null;
  chatWidth: number | null;
  chatHeight: number | null;
  chatRadius: number | null;
  messageRadius: number | null;
  chatShadow: "none" | "sm" | "md" | "lg" | "2xl" | null;
  floatingPosition: "bottom-right" | "bottom-left" | null;
};

export type ChatWidgetConfig = Omit<
  ChatConfig,
  | "model"
  | "temperature"
  | "maxTokens"
  | "maxMessagesPerDay"
  | "maxUserMessagesPerConversation"
> & {
  style: BotStyle;
};

export type ChatConfigPatch = Partial<ChatConfig> & {
  style?: BotStyle;
};
export type ChatConfigResponse = { bot?: Bot };

export type EditBotInput = {
  name: string;
  description: string | null;
  personality: BotPersonality;
  language: string;
  systemMessage: string | null;
};

export type BotResponse = { bot?: Bot };
export type BotsResponse = { bots?: Bot[] };

export type BotDeployment = {
  id: string;
  publicKey: string;
  status: "ACTIVE" | "INACTIVE";
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string | null;
};

export type EditDeploymentInput = {
  allowedOrigins?: string[];
  status?: BotDeployment["status"];
};

export type DeploymentResponse = { deployment: BotDeployment | null };

export type FetchDataItem = {
  id: string;
  type: "PDF" | "TXT" | "DOC" | "DOCX" | "WEBSITE";
  url: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  size: number;
  lastUpdatedAt: string;
};

export type FetchDataDetails = {
  id: string;
  type: FetchDataItem["type"];
  title: string;
  url: string;
  status: FetchDataItem["status"];
  lastUpdatedAt: string;
  markdown: string;
};

export type FetchDataPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
};

export type FetchDataResponse = {
  documents: FetchDataItem[];
  totalSize: number;
  pagination: FetchDataPagination;
};

export type FetchDataQueryParams = {
  page: number;
  pageSize: number;
  search: string;
};

export type FetchDataPayload = {
  documents?: FetchDataItem[];
  totalSize?: number;
  pagination?: FetchDataPagination;
};

export type UploadFileResponse = {
  documentId?: string;
};

export type DocumentStatusUpdatedEvent = {
  documentId: string;
  status: "READY" | "FAILED";
  updatedAt: string;
};
