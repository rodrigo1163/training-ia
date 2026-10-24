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
  slug: string;
  documentCount: number;
  createdAt: string;
};

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
