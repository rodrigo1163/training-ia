import { z } from "zod";

import {
  botPersonalities,
  type Bot,
  type BotStyle,
  type BotPersonality,
  type ChatConfig,
} from "@/api/bots/types";
import {
  CHAT_MODEL_CATALOG,
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
  type ChatModelId,
} from "@training-ia/contracts";
import { isSafeCssColor } from "@training-ia/ui/helpers/chat-colors";

import {
  MAX_STARTER_QUESTION_LENGTH,
  normalizeStarterQuestion,
} from "../../-helpers/starter-question";

export const personalityLabels: Record<BotPersonality, string> = {
  CONCISE: "Concisa",
  DETAILED: "Detalhada",
  EDUCATIONAL: "Educacional",
  EMPATHETIC: "Empathetic",
  FRIENDLY: "Friendly",
  NEUTRAL: "Neutra",
  PLAYFUL: "Playful",
  PROFESSIONAL: "Profissional",
  TECHNICAL: "Technical",
};

export const botInformationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name must be at most 80 characters." }),
  description: z
    .string()
    .trim()
    .max(500, { error: "Description must be at most 500 characters." }),
});

export const botBehaviorSchema = z.object({
  personality: z.enum(botPersonalities),
  language: z
    .string()
    .trim()
    .min(2, { error: "O idioma deve ter pelo menos 2 caracteres." })
    .max(20, { error: "Language must be at most 20 characters." }),
});

export const botInstructionsSchema = z.object({
  systemMessage: z.string().trim().max(10_000, {
    error: "System message must be at most 10,000 characters.",
  }),
});

export type InformationFormValues = z.infer<typeof botInformationSchema>;
export type BehaviorFormValues = z.infer<typeof botBehaviorSchema>;
export type InstructionsFormValues = z.infer<typeof botInstructionsSchema>;

const chatColorSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isSafeCssColor(value), {
    error: "Use a valid hexadecimal, RGB, or HSL color.",
  });

export const DEFAULT_CHAT_COLORS = {
  chatBackgroundColor: "#ffffff",
  headerFooterBackgroundColor: "#0865cf",
  footerBackgroundColor: "",
  inputBackgroundColor: "",
  inputTextColor: "",
  starterQuestionsTextColor: "",
  assistantMessageBackgroundColor: "#f6f8fc",
  assistantMessageTextColor: "",
  userMessageBackgroundColor: "#0865cf",
  userMessageTextColor: "",
  launcherBackgroundColor: "",
  chatBorderColor: "",
} as const;

export const DEFAULT_DARK_CHAT_COLORS = {
  chatBackgroundColor: "#111827",
  headerFooterBackgroundColor: "#1f2937",
  footerBackgroundColor: "#1f2937",
  inputBackgroundColor: "#111827",
  inputTextColor: "#f9fafb",
  starterQuestionsTextColor: "#f9fafb",
  assistantMessageBackgroundColor: "#1f2937",
  userMessageBackgroundColor: "#2563eb",
  assistantMessageTextColor: "#f9fafb",
  userMessageTextColor: "#ffffff",
  launcherBackgroundColor: "#2563eb",
  chatBorderColor: "#374151",
} as const;

export const CHAT_STYLE_DEFAULTS = {
  chatWidth: 424,
  chatHeight: 676,
  chatRadius: 12,
  messageRadius: 8,
  chatBorderWidth: 0,
  chatShadow: "2xl",
  floatingPosition: "bottom-right",
  launcherSize: 56,
  launcherIcon: "chat",
  chatFontFamily: "sans",
  chatMessageFontSize: "md",
} as const;

export const CHAT_STYLE_LIMITS = {
  chatWidth: { min: 320, max: 600 },
  chatHeight: { min: 480, max: 800 },
  chatRadius: { min: 0, max: 32 },
  messageRadius: { min: 0, max: 24 },
  chatBorderWidth: { min: 0, max: 4 },
  launcherSize: { min: 48, max: 72, step: 4 },
} as const;

export const chatShadowOptions = ["none", "sm", "md", "lg", "2xl"] as const;
export const floatingPositionOptions = ["bottom-right", "bottom-left"] as const;
export const launcherIconOptions = [
  "chat",
  "bot",
  "sparkles",
  "avatar",
] as const;
export const chatFontFamilyOptions = ["sans", "serif", "mono"] as const;
export const chatMessageFontSizeOptions = ["sm", "md", "lg"] as const;

const chatColorPaletteSchema = z.object({
  chatBackgroundColor: chatColorSchema,
  headerFooterBackgroundColor: chatColorSchema,
  footerBackgroundColor: chatColorSchema,
  inputBackgroundColor: chatColorSchema,
  inputTextColor: chatColorSchema,
  starterQuestionsTextColor: chatColorSchema,
  assistantMessageBackgroundColor: chatColorSchema,
  assistantMessageTextColor: chatColorSchema,
  userMessageBackgroundColor: chatColorSchema,
  userMessageTextColor: chatColorSchema,
  launcherBackgroundColor: chatColorSchema,
  chatBorderColor: chatColorSchema,
});

const botStyleFormSchema = z.object({
  colors: z.object({
    light: chatColorPaletteSchema,
    dark: chatColorPaletteSchema,
  }),
  launcherSize: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.launcherSize.min)
    .max(CHAT_STYLE_LIMITS.launcherSize.max)
    .refine(
      (value) =>
        (value - CHAT_STYLE_LIMITS.launcherSize.min) %
          CHAT_STYLE_LIMITS.launcherSize.step ===
        0,
      { error: "Launcher size must increase in 4 px steps." },
    ),
  launcherIcon: z.enum(["chat", "bot", "sparkles", "avatar"]),
  chatBorderWidth: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.chatBorderWidth.min)
    .max(CHAT_STYLE_LIMITS.chatBorderWidth.max),
  chatFontFamily: z.enum(["sans", "serif", "mono"]),
  chatMessageFontSize: z.enum(["sm", "md", "lg"]),
  chatWidth: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.chatWidth.min)
    .max(CHAT_STYLE_LIMITS.chatWidth.max),
  chatHeight: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.chatHeight.min)
    .max(CHAT_STYLE_LIMITS.chatHeight.max),
  chatRadius: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.chatRadius.min)
    .max(CHAT_STYLE_LIMITS.chatRadius.max),
  messageRadius: z
    .number()
    .int()
    .min(CHAT_STYLE_LIMITS.messageRadius.min)
    .max(CHAT_STYLE_LIMITS.messageRadius.max),
  chatShadow: z.enum(["none", "sm", "md", "lg", "2xl"]),
  floatingPosition: z.enum(["bottom-right", "bottom-left"]),
});

function resolveColorPalette(
  colors: BotStyle["colors"]["light"],
  defaults: typeof DEFAULT_CHAT_COLORS | typeof DEFAULT_DARK_CHAT_COLORS,
) {
  return {
    chatBackgroundColor:
      colors.chatBackgroundColor ?? defaults.chatBackgroundColor,
    headerFooterBackgroundColor:
      colors.headerFooterBackgroundColor ??
      defaults.headerFooterBackgroundColor,
    footerBackgroundColor:
      colors.footerBackgroundColor ?? defaults.footerBackgroundColor,
    inputBackgroundColor:
      colors.inputBackgroundColor ?? defaults.inputBackgroundColor,
    inputTextColor: colors.inputTextColor ?? defaults.inputTextColor,
    starterQuestionsTextColor:
      colors.starterQuestionsTextColor ?? defaults.starterQuestionsTextColor,
    assistantMessageBackgroundColor:
      colors.assistantMessageBackgroundColor ??
      defaults.assistantMessageBackgroundColor,
    assistantMessageTextColor:
      colors.assistantMessageTextColor ?? defaults.assistantMessageTextColor,
    userMessageBackgroundColor:
      colors.userMessageBackgroundColor ?? defaults.userMessageBackgroundColor,
    userMessageTextColor:
      colors.userMessageTextColor ?? defaults.userMessageTextColor,
    launcherBackgroundColor:
      colors.launcherBackgroundColor ?? defaults.launcherBackgroundColor,
    chatBorderColor: colors.chatBorderColor ?? defaults.chatBorderColor,
  };
}

const starterQuestionSchema = z.object({
  value: z
    .string()
    .refine(
      (value) =>
        value.trim() === "" || value.length <= MAX_STARTER_QUESTION_LENGTH,
      {
        error: `Starter questions must be at most ${MAX_STARTER_QUESTION_LENGTH} characters.`,
      },
    ),
});

const starterQuestionsSchema = z
  .array(starterQuestionSchema)
  .max(3, { error: "You can add at most 3 starter questions." })
  .superRefine((questions, context) => {
    const firstQuestionByNormalizedValue = new Map<string, number>();

    for (const [index, question] of questions.entries()) {
      const normalizedValue = normalizeStarterQuestion(question.value);

      if (normalizedValue === "") {
        continue;
      }

      if (firstQuestionByNormalizedValue.has(normalizedValue)) {
        context.addIssue({
          code: "custom",
          message: "Starter questions must be unique.",
          path: [index, "value"],
        });
        continue;
      }

      firstQuestionByNormalizedValue.set(normalizedValue, index);
    }
  });

export const chatModelDefinitions = CHAT_MODEL_CATALOG.filter(
  (model) => model.purpose === "chat",
);
const chatModelIds = chatModelDefinitions.map((model) => model.id);
const chatModelSchema = z.union([
  z.null(),
  z.custom<ChatModelId>(
    (value) =>
      typeof value === "string" &&
      chatModelIds.some((modelId) => modelId === value),
    { error: "Select a valid chat model." },
  ),
]);

const nullableTemperatureSchema = z
  .number({ error: "Temperature must be a number." })
  .min(0, { error: "Temperature must be at least 0." })
  .max(2, { error: "Temperature must be at most 2." })
  .nullable();

const nullableMaxTokensSchema = z
  .number({ error: "Max tokens must be a number." })
  .int({ error: "Max tokens must be an integer." })
  .min(1, { error: "Max tokens must be at least 1." })
  .max(200_000, { error: "Max tokens must be at most 200000." })
  .nullable();

export const MAX_CHAT_MESSAGE_LIMIT = 1_000_000;
const nullableChatMessageLimitSchema = z
  .number({ error: "The message limit must be a number." })
  .int({ error: "The message limit must be an integer." })
  .min(1, { error: "The message limit must be at least 1." })
  .max(MAX_CHAT_MESSAGE_LIMIT, {
    error: `The message limit must be at most ${MAX_CHAT_MESSAGE_LIMIT}.`,
  })
  .nullable();

export const CHAT_CONFIG_TEXT_LIMITS = {
  inputPlaceholder: 120,
  submitButtonText: 40,
  initialMessage: 2_000,
  headerStatusText: 120,
} as const;

export const chatConfigSchema = z
  .object({
    inputPlaceholder: z.string().max(CHAT_CONFIG_TEXT_LIMITS.inputPlaceholder, {
      error: `Input placeholder must be at most ${CHAT_CONFIG_TEXT_LIMITS.inputPlaceholder} characters.`,
    }),
    submitButtonText: z.string().max(CHAT_CONFIG_TEXT_LIMITS.submitButtonText, {
      error: `Submit button text must be at most ${CHAT_CONFIG_TEXT_LIMITS.submitButtonText} characters.`,
    }),
    showMessageTimestamps: z.boolean(),
    starterQuestions: starterQuestionsSchema,
    initialMessage: z.string().max(CHAT_CONFIG_TEXT_LIMITS.initialMessage, {
      error: `Initial message must be at most ${CHAT_CONFIG_TEXT_LIMITS.initialMessage} characters.`,
    }),
    headerStatusText: z.string().max(CHAT_CONFIG_TEXT_LIMITS.headerStatusText, {
      error: `Header status must be at most ${CHAT_CONFIG_TEXT_LIMITS.headerStatusText} characters.`,
    }),
    style: botStyleFormSchema,
    model: chatModelSchema,
    temperature: nullableTemperatureSchema,
    maxTokens: nullableMaxTokensSchema,
    maxMessagesPerDay: nullableChatMessageLimitSchema,
    maxUserMessagesPerConversation: nullableChatMessageLimitSchema,
    generateStarterQuestionsAfterResponse: z.boolean(),
  })
  .superRefine((values, context) => {
    const modelId = values.model ?? DEFAULT_CHAT_MODEL_ID;
    const model = getChatModelDefinition(modelId);

    if (!model || model.purpose !== "chat") {
      context.addIssue({
        code: "custom",
        message: "Select a valid chat model.",
        path: ["model"],
      });
      return;
    }

    if (values.temperature !== null && !model.supportsTemperature) {
      context.addIssue({
        code: "custom",
        message: "This model does not support temperature.",
        path: ["temperature"],
      });
    }

    if (values.maxTokens !== null && !model.supportsMaxTokens) {
      context.addIssue({
        code: "custom",
        message: "This model does not support max tokens.",
        path: ["maxTokens"],
      });
    }

    const maxTokensLimit = Math.min(model.maxTokens ?? 200_000, 200_000);
    if (values.maxTokens !== null && values.maxTokens > maxTokensLimit) {
      context.addIssue({
        code: "custom",
        message: `Max tokens must be at most ${maxTokensLimit}.`,
        path: ["maxTokens"],
      });
    }
  });

export type ChatConfigFormValues = z.infer<typeof chatConfigSchema>;

export function getInformationValues(bot: Bot): InformationFormValues {
  return {
    name: bot.name,
    description: bot.description ?? "",
  };
}

export function getBehaviorValues(bot: Bot): BehaviorFormValues {
  return {
    personality: bot.personality,
    language: bot.language,
  };
}

export function getInstructionsValues(bot: Bot): InstructionsFormValues {
  return { systemMessage: bot.systemMessage ?? "" };
}

export function getChatConfigValues(
  config: ChatConfig,
  style: BotStyle,
): ChatConfigFormValues {
  return {
    inputPlaceholder: config.inputPlaceholder ?? "",
    submitButtonText: config.submitButtonText ?? "",
    showMessageTimestamps: config.showMessageTimestamps,
    starterQuestions: config.starterQuestions.map((value) => ({ value })),
    initialMessage: config.initialMessage ?? "",
    headerStatusText: config.headerStatusText ?? "",
    style: {
      colors: {
        light: resolveColorPalette(style.colors.light, DEFAULT_CHAT_COLORS),
        dark: resolveColorPalette(style.colors.dark, DEFAULT_DARK_CHAT_COLORS),
      },
      launcherSize: style.launcherSize ?? CHAT_STYLE_DEFAULTS.launcherSize,
      launcherIcon: style.launcherIcon ?? CHAT_STYLE_DEFAULTS.launcherIcon,
      chatBorderWidth:
        style.chatBorderWidth ?? CHAT_STYLE_DEFAULTS.chatBorderWidth,
      chatFontFamily:
        style.chatFontFamily ?? CHAT_STYLE_DEFAULTS.chatFontFamily,
      chatMessageFontSize:
        style.chatMessageFontSize ?? CHAT_STYLE_DEFAULTS.chatMessageFontSize,
      chatWidth: style.chatWidth ?? CHAT_STYLE_DEFAULTS.chatWidth,
      chatHeight: style.chatHeight ?? CHAT_STYLE_DEFAULTS.chatHeight,
      chatRadius: style.chatRadius ?? CHAT_STYLE_DEFAULTS.chatRadius,
      messageRadius: style.messageRadius ?? CHAT_STYLE_DEFAULTS.messageRadius,
      chatShadow: style.chatShadow ?? CHAT_STYLE_DEFAULTS.chatShadow,
      floatingPosition:
        style.floatingPosition ?? CHAT_STYLE_DEFAULTS.floatingPosition,
    },
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    maxMessagesPerDay: config.maxMessagesPerDay,
    maxUserMessagesPerConversation: config.maxUserMessagesPerConversation,
    generateStarterQuestionsAfterResponse:
      config.generateStarterQuestionsAfterResponse,
  };
}

export function toNullableText(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

export function hasDirtyStarterQuestions(value: unknown): boolean {
  if (!Array.isArray(value)) return Boolean(value);

  return value.some((entry) => {
    if (entry === true) return true;
    if (!entry || typeof entry !== "object") return false;

    return "value" in entry && Boolean(entry.value);
  });
}
