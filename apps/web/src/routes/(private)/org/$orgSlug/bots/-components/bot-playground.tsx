import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ButtonSpinner } from "@/components/button-spinner";
import {
  useEditBotMutation,
  useEditChatConfigMutation,
} from "@/hooks/use-bots";
import { BotChat } from "./bot-chat";
import { DocumentTextEditor } from "./document-text-editor";
import { ChatAvatarPicker } from "./chat-avatar-picker";
import {
  botLanguages,
  botPersonalities,
  type Bot,
  type ChatConfig,
  type ChatConfigPatch,
  type BotPersonality,
  type EditBotInput,
} from "@/api/bots/types";
import {
  CHAT_MODEL_CATALOG,
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
  STARTER_QUESTIONS_MODEL_ID,
  type ChatModelId,
} from "@training-ia/contracts";
import { Button } from "@training-ia/ui/components/ui/button";
import { ColorPicker } from "@training-ia/ui/components/ui/color-picker";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";
import { Slider } from "@training-ia/ui/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";
import { toast } from "@training-ia/ui/components/ui/toast";
import { isSafeCssColor } from "@training-ia/ui/helpers/chat-colors";
import {
  MAX_STARTER_QUESTION_LENGTH,
  normalizeStarterQuestion,
} from "../-helpers/starter-question";

const personalityLabels: Record<BotPersonality, string> = {
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

const botInformationSchema = z.object({
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

const botBehaviorSchema = z.object({
  personality: z.enum(botPersonalities),
  language: z
    .string()
    .trim()
    .min(2, { error: "O idioma deve ter pelo menos 2 caracteres." })
    .max(20, { error: "Language must be at most 20 characters." }),
});

const botInstructionsSchema = z.object({
  systemMessage: z.string().trim().max(10_000, {
    error: "System message must be at most 10,000 characters.",
  }),
});

type InformationFormValues = z.infer<typeof botInformationSchema>;
type BehaviorFormValues = z.infer<typeof botBehaviorSchema>;
type InstructionsFormValues = z.infer<typeof botInstructionsSchema>;
const chatColorSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isSafeCssColor(value), {
    error: "Use a valid hexadecimal, RGB, or HSL color.",
  });

const DEFAULT_CHAT_COLORS = {
  chatBackgroundColor: "#ffffff",
  headerFooterBackgroundColor: "#0865cf",
  assistantMessageBackgroundColor: "#f6f8fc",
  userMessageBackgroundColor: "#0865cf",
} as const;

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

const chatModelDefinitions = CHAT_MODEL_CATALOG.filter(
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

const MAX_CHAT_MESSAGE_LIMIT = 1_000_000;
const nullableChatMessageLimitSchema = z
  .number({ error: "The message limit must be a number." })
  .int({ error: "The message limit must be an integer." })
  .min(1, { error: "The message limit must be at least 1." })
  .max(MAX_CHAT_MESSAGE_LIMIT, {
    error: `The message limit must be at most ${MAX_CHAT_MESSAGE_LIMIT}.`,
  })
  .nullable();

const CHAT_CONFIG_TEXT_LIMITS = {
  inputPlaceholder: 120,
  submitButtonText: 40,
  initialMessage: 2_000,
  headerStatusText: 120,
} as const;

const chatConfigSchema = z
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
    chatBackgroundColor: chatColorSchema,
    headerFooterBackgroundColor: chatColorSchema,
    assistantMessageBackgroundColor: chatColorSchema,
    userMessageBackgroundColor: chatColorSchema,
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

type ChatConfigFormValues = z.infer<typeof chatConfigSchema>;

function getInformationValues(bot: Bot): InformationFormValues {
  return {
    name: bot.name,
    description: bot.description ?? "",
  };
}

function getBehaviorValues(bot: Bot): BehaviorFormValues {
  return {
    personality: bot.personality,
    language: bot.language,
  };
}

function getInstructionsValues(bot: Bot): InstructionsFormValues {
  return { systemMessage: bot.systemMessage ?? "" };
}

function getChatConfigValues(config: ChatConfig): ChatConfigFormValues {
  return {
    inputPlaceholder: config.inputPlaceholder ?? "",
    submitButtonText: config.submitButtonText ?? "",
    showMessageTimestamps: config.showMessageTimestamps,
    starterQuestions: config.starterQuestions.map((value) => ({ value })),
    initialMessage: config.initialMessage ?? "",
    headerStatusText: config.headerStatusText ?? "",
    chatBackgroundColor:
      config.chatBackgroundColor ?? DEFAULT_CHAT_COLORS.chatBackgroundColor,
    headerFooterBackgroundColor:
      config.headerFooterBackgroundColor ??
      DEFAULT_CHAT_COLORS.headerFooterBackgroundColor,
    assistantMessageBackgroundColor:
      config.assistantMessageBackgroundColor ??
      DEFAULT_CHAT_COLORS.assistantMessageBackgroundColor,
    userMessageBackgroundColor:
      config.userMessageBackgroundColor ??
      DEFAULT_CHAT_COLORS.userMessageBackgroundColor,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    maxMessagesPerDay: config.maxMessagesPerDay,
    maxUserMessagesPerConversation: config.maxUserMessagesPerConversation,
    generateStarterQuestionsAfterResponse:
      config.generateStarterQuestionsAfterResponse,
  };
}

function toNullableText(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function hasDirtyStarterQuestions(value: unknown): boolean {
  if (!Array.isArray(value)) return Boolean(value);

  return value.some((entry) => {
    if (entry === true) return true;
    if (!entry || typeof entry !== "object") return false;

    return "value" in entry && Boolean(entry.value);
  });
}

function ChatConfigSection({
  bot,
  botSlug,
  isOtherMutationPending,
  onLiveChatConfigChange,
  onSavingChange,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  isOtherMutationPending: boolean;
  onLiveChatConfigChange: (config: ChatConfig) => void;
  onSavingChange: (isSaving: boolean) => void;
  orgSlug: string;
}) {
  const chatConfigMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const chatForm = useForm<ChatConfigFormValues>({
    defaultValues: getChatConfigValues(bot.chatConfig),
    mode: "onChange",
    resolver: zodResolver(chatConfigSchema),
  });
  const { fields, append, remove } = useFieldArray({
    control: chatForm.control,
    name: "starterQuestions",
  });
  const isSaving = chatConfigMutation.isPending || isOtherMutationPending;
  const previousBotSlugRef = useRef(botSlug);
  const liveValues = useWatch({ control: chatForm.control });
  const selectedModel = liveValues.model ?? null;
  const selectedModelDefinition = getChatModelDefinition(
    selectedModel ?? DEFAULT_CHAT_MODEL_ID,
  );
  const primaryModelDefinition =
    selectedModelDefinition?.purpose === "chat"
      ? selectedModelDefinition
      : getChatModelDefinition(DEFAULT_CHAT_MODEL_ID)!;
  const suggestionsModel = getChatModelDefinition(STARTER_QUESTIONS_MODEL_ID);

  useEffect(() => {
    if (
      !primaryModelDefinition.supportsTemperature &&
      liveValues.temperature !== null
    ) {
      chatForm.setValue("temperature", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (
      !primaryModelDefinition.supportsMaxTokens &&
      liveValues.maxTokens !== null
    ) {
      chatForm.setValue("maxTokens", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    chatForm,
    liveValues.maxTokens,
    liveValues.temperature,
    primaryModelDefinition,
  ]);

  const liveChatConfig = useMemo(
    () => ({
      ...bot.chatConfig,
      inputPlaceholder: toNullableText(liveValues.inputPlaceholder ?? ""),
      submitButtonText: toNullableText(liveValues.submitButtonText ?? ""),
      showMessageTimestamps: liveValues.showMessageTimestamps ?? false,
      starterQuestions: (liveValues.starterQuestions ?? [])
        .map(({ value }) => (value ?? "").trim())
        .filter(Boolean),
      initialMessage: toNullableText(liveValues.initialMessage ?? ""),
      headerStatusText: toNullableText(liveValues.headerStatusText ?? ""),
      chatBackgroundColor: toNullableText(liveValues.chatBackgroundColor ?? ""),
      headerFooterBackgroundColor: toNullableText(
        liveValues.headerFooterBackgroundColor ?? "",
      ),
      assistantMessageBackgroundColor: toNullableText(
        liveValues.assistantMessageBackgroundColor ?? "",
      ),
      userMessageBackgroundColor: toNullableText(
        liveValues.userMessageBackgroundColor ?? "",
      ),
      model: liveValues.model ?? null,
      temperature: liveValues.temperature ?? null,
      maxTokens: liveValues.maxTokens ?? null,
      maxMessagesPerDay: liveValues.maxMessagesPerDay ?? null,
      maxUserMessagesPerConversation:
        liveValues.maxUserMessagesPerConversation ?? null,
      generateStarterQuestionsAfterResponse:
        liveValues.generateStarterQuestionsAfterResponse ?? false,
    }),
    [bot.chatConfig, liveValues],
  );

  useEffect(() => {
    onLiveChatConfigChange(liveChatConfig);
  }, [liveChatConfig, onLiveChatConfigChange]);

  useEffect(() => {
    onSavingChange(chatConfigMutation.isPending);
  }, [chatConfigMutation.isPending, onSavingChange]);

  useEffect(() => {
    const botChanged = previousBotSlugRef.current !== botSlug;

    if (botChanged || !chatForm.formState.isDirty) {
      chatForm.reset(getChatConfigValues(bot.chatConfig));
    }
    previousBotSlugRef.current = botSlug;
  }, [botSlug, bot.chatConfig, chatForm]);

  function onSubmit(values: ChatConfigFormValues) {
    if (isSaving) return;

    const dirtyFields = chatForm.formState.dirtyFields;
    const patch: ChatConfigPatch = {};

    if (dirtyFields.inputPlaceholder) {
      patch.inputPlaceholder = toNullableText(values.inputPlaceholder);
    }
    if (dirtyFields.submitButtonText) {
      patch.submitButtonText = toNullableText(values.submitButtonText);
    }
    if (dirtyFields.showMessageTimestamps) {
      patch.showMessageTimestamps = values.showMessageTimestamps;
    }
    if (hasDirtyStarterQuestions(dirtyFields.starterQuestions)) {
      patch.starterQuestions = values.starterQuestions
        .map(({ value }) => value.trim())
        .filter(Boolean);
    }
    if (dirtyFields.initialMessage) {
      patch.initialMessage = toNullableText(values.initialMessage);
    }
    if (dirtyFields.headerStatusText) {
      patch.headerStatusText = toNullableText(values.headerStatusText);
    }
    if (dirtyFields.chatBackgroundColor) {
      patch.chatBackgroundColor = toNullableText(values.chatBackgroundColor);
    }
    if (dirtyFields.headerFooterBackgroundColor) {
      patch.headerFooterBackgroundColor = toNullableText(
        values.headerFooterBackgroundColor,
      );
    }
    if (dirtyFields.assistantMessageBackgroundColor) {
      patch.assistantMessageBackgroundColor = toNullableText(
        values.assistantMessageBackgroundColor,
      );
    }
    if (dirtyFields.userMessageBackgroundColor) {
      patch.userMessageBackgroundColor = toNullableText(
        values.userMessageBackgroundColor,
      );
    }
    if (dirtyFields.model) patch.model = values.model;
    if (dirtyFields.temperature) patch.temperature = values.temperature;
    if (dirtyFields.maxTokens) patch.maxTokens = values.maxTokens;
    if (dirtyFields.maxMessagesPerDay) {
      patch.maxMessagesPerDay = values.maxMessagesPerDay;
    }
    if (dirtyFields.maxUserMessagesPerConversation) {
      patch.maxUserMessagesPerConversation =
        values.maxUserMessagesPerConversation;
    }
    if (dirtyFields.generateStarterQuestionsAfterResponse) {
      patch.generateStarterQuestionsAfterResponse =
        values.generateStarterQuestionsAfterResponse;
    }

    chatConfigMutation.mutate(patch, {
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
      onSuccess: (updatedBot) => {
        chatForm.reset(getChatConfigValues(updatedBot.chatConfig));
        toast.add({
          title: "Chat configuration saved successfully.",
          type: "success",
        });
      },
    });
  }

  return (
    <form noValidate onSubmit={chatForm.handleSubmit(onSubmit)}>
      <section className="rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Chat avatar</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the image shown next to the assistant messages.
          </p>
        </div>
        <div className="mt-6">
          <ChatAvatarPicker bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Chat configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes are saved when you click Save changes.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="header-status"
          >
            Header status
            <Input
              {...chatForm.register("headerStatusText")}
              disabled={isSaving}
              id="header-status"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.headerStatusText}
              placeholder="We are online"
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="input-placeholder"
          >
            Input placeholder
            <Input
              {...chatForm.register("inputPlaceholder")}
              disabled={isSaving}
              id="input-placeholder"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.inputPlaceholder}
              placeholder="Type your message..."
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="submit-text"
          >
            Submit button text
            <Input
              {...chatForm.register("submitButtonText")}
              disabled={isSaving}
              id="submit-text"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.submitButtonText}
              placeholder="Send"
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium md:col-span-2"
            htmlFor="initial-message"
          >
            Initial message
            <Textarea
              {...chatForm.register("initialMessage")}
              disabled={isSaving}
              id="initial-message"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.initialMessage}
              placeholder="Hello! 👋 How can I help you today?"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Controller
            control={chatForm.control}
            name="showMessageTimestamps"
            render={({ field }) => (
              <label
                className="flex items-center gap-2 text-sm"
                htmlFor="show-timestamps"
              >
                <Checkbox
                  checked={field.value}
                  disabled={isSaving}
                  id="show-timestamps"
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Show message timestamps
              </label>
            )}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium">Starter questions</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Add up to three unique questions shown in the initial state.
              </p>
            </div>
            <Button
              disabled={isSaving || fields.length >= 3}
              onClick={() => append({ value: "" })}
              type="button"
              variant="outline"
            >
              Add question
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {fields.map((field, index) => (
              <div className="flex items-start gap-2" key={field.id}>
                <Field
                  className="min-w-0 flex-1"
                  data-invalid={Boolean(
                    chatForm.formState.errors.starterQuestions?.[index]?.value,
                  )}
                >
                  <Input
                    {...chatForm.register(`starterQuestions.${index}.value`)}
                    aria-invalid={Boolean(
                      chatForm.formState.errors.starterQuestions?.[index]
                        ?.value,
                    )}
                    disabled={isSaving}
                    placeholder={`Question ${index + 1}`}
                  />
                  {chatForm.formState.errors.starterQuestions?.[index]
                    ?.value && (
                    <FieldError
                      errors={[
                        chatForm.formState.errors.starterQuestions[index].value,
                      ]}
                    />
                  )}
                </Field>
                <Button
                  aria-label={`Remove starter question ${index + 1}`}
                  disabled={isSaving}
                  onClick={() => remove(index)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  ×
                </Button>
              </div>
            ))}
            {chatForm.formState.errors.starterQuestions?.message && (
              <FieldError
                errors={[chatForm.formState.errors.starterQuestions]}
              />
            )}
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          {(
            [
              ["chatBackgroundColor", "Chat background"],
              ["headerFooterBackgroundColor", "Header and footer background"],
              [
                "assistantMessageBackgroundColor",
                "Assistant message background",
              ],
              ["userMessageBackgroundColor", "User message background"],
            ] as const
          ).map(([field, label]) => (
            <Controller
              control={chatForm.control}
              key={field}
              name={field}
              render={({ field: inputField, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={inputField.name}>{label}</FieldLabel>
                  <ColorPicker
                    aria-invalid={fieldState.invalid}
                    color={inputField.value}
                    disabled={isSaving}
                    inputAriaInvalid={fieldState.invalid}
                    inputAriaLabel={label}
                    inputId={inputField.name}
                    inputOnBlur={inputField.onBlur}
                    inputRef={inputField.ref}
                    onChange={inputField.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">AI configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the model and generation parameters used by this bot.
            Changes are saved when you click Save changes.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <Controller
            control={chatForm.control}
            name="model"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                <Select
                  disabled={isSaving}
                  onValueChange={(value) => {
                    if (value === DEFAULT_CHAT_MODEL_ID) {
                      field.onChange(null);
                      return;
                    }

                    const model = getChatModelDefinition(value);
                    if (model?.purpose === "chat") {
                      field.onChange(value as ChatModelId);
                    }
                  }}
                  value={field.value ?? DEFAULT_CHAT_MODEL_ID}
                >
                  <SelectTrigger
                    aria-invalid={fieldState.invalid}
                    id={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatModelDefinitions.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                        {model.id === DEFAULT_CHAT_MODEL_ID && " (default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The default option is stored as null in the configuration.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={chatForm.control}
            name="temperature"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor={field.name}>Temperature</FieldLabel>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {field.value === null
                      ? "Model default"
                      : field.value.toFixed(1)}
                  </span>
                </div>
                <Slider
                  aria-invalid={fieldState.invalid}
                  aria-label="Temperature"
                  disabled={
                    isSaving || !primaryModelDefinition.supportsTemperature
                  }
                  id={field.name}
                  max={2}
                  min={0}
                  onBlur={field.onBlur}
                  onValueChange={([value]) => {
                    if (value !== undefined) field.onChange(value);
                  }}
                  ref={field.ref}
                  step={0.1}
                  value={[field.value ?? 1]}
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Optional. Drag to choose a value from 0 to 2.
                  </p>
                  {field.value !== null && (
                    <Button
                      className="-mt-1"
                      disabled={isSaving}
                      onClick={() => field.onChange(null)}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      Use model default
                    </Button>
                  )}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={chatForm.control}
            name="maxTokens"
            render={({ field, fieldState }) => {
              const maxTokensLimit = Math.min(
                primaryModelDefinition.maxTokens ?? 200_000,
                200_000,
              );

              return (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>Max tokens</FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Model default"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max tokens"
                    disabled={
                      isSaving || !primaryModelDefinition.supportsMaxTokens
                    }
                    id={field.name}
                    max={maxTokensLimit}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={maxTokensLimit >= 1_000 ? 100 : 1}
                    value={[field.value ?? Math.min(maxTokensLimit, 1_000)]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to choose up to{" "}
                      {maxTokensLimit.toLocaleString()} tokens.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isSaving}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Use model default
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />

          <Controller
            control={chatForm.control}
            name="generateStarterQuestionsAfterResponse"
            render={({ field }) => (
              <div className="space-y-1 md:col-span-2">
                <label
                  className="flex items-center gap-2 text-sm"
                  htmlFor="generate-starters"
                >
                  <Checkbox
                    aria-label="Generate starter questions after a response"
                    checked={field.value}
                    disabled={isSaving}
                    id="generate-starters"
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Generate starter questions after a response
                </label>
                <p className="ml-6 text-xs text-muted-foreground">
                  Suggestions use the {suggestionsModel?.label ?? "configured"}{" "}
                  model and remain controlled by the backend.
                </p>
              </div>
            )}
          />
        </div>

        <div className="mt-6">
          <h4 className="mb-1 text-sm font-medium">Usage limits</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Leave a field empty to allow unlimited messages. Values are saved
            when you click Save changes.
          </p>
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <Controller
              control={chatForm.control}
              name="maxMessagesPerDay"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>
                      Max messages per day
                    </FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Unlimited"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max messages per day"
                    disabled={isSaving}
                    id={field.name}
                    max={MAX_CHAT_MESSAGE_LIMIT}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={1}
                    value={[field.value ?? 100]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to set a daily limit up to{" "}
                      {MAX_CHAT_MESSAGE_LIMIT.toLocaleString()}.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isSaving}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Unlimited
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={chatForm.control}
              name="maxUserMessagesPerConversation"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>
                      Max user messages per conversation
                    </FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Unlimited"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max user messages per conversation"
                    disabled={isSaving}
                    id={field.name}
                    max={MAX_CHAT_MESSAGE_LIMIT}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={1}
                    value={[field.value ?? 10]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to set a conversation limit up to{" "}
                      {MAX_CHAT_MESSAGE_LIMIT.toLocaleString()}.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isSaving}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Unlimited
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={
              isSaving ||
              !chatForm.formState.isDirty ||
              !chatForm.formState.isValid
            }
            type="submit"
          >
            {isSaving ? "Saving..." : "Save changes"}
            {isSaving && <ButtonSpinner />}
          </Button>
        </div>
      </section>
    </form>
  );
}

function getEditBotInput(
  bot: Bot,
  values: Partial<EditBotInput>,
): EditBotInput {
  return {
    name: bot.name,
    description: bot.description,
    personality: bot.personality,
    language: bot.language,
    systemMessage: bot.systemMessage,
    ...values,
  };
}

export function BotPlayground({
  bot,
  botSlug,
  onOpenEmbed,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  onOpenEmbed: () => Promise<void>;
  orgSlug: string;
}) {
  const [liveChatConfig, setLiveChatConfig] = useState<ChatConfig>(
    bot.chatConfig,
  );
  const [isChatConfigSaving, setIsChatConfigSaving] = useState(false);
  const handleLiveChatConfigChange = useCallback((config: ChatConfig) => {
    setLiveChatConfig((current) =>
      JSON.stringify(current) === JSON.stringify(config) ? current : config,
    );
  }, []);

  useEffect(() => {
    setLiveChatConfig(bot.chatConfig);
  }, [bot.chatConfig]);

  const informationForm = useForm<InformationFormValues>({
    defaultValues: getInformationValues(bot),
    resolver: zodResolver(botInformationSchema),
  });
  const behaviorForm = useForm<BehaviorFormValues>({
    defaultValues: getBehaviorValues(bot),
    resolver: zodResolver(botBehaviorSchema),
  });
  const instructionsForm = useForm<InstructionsFormValues>({
    defaultValues: getInstructionsValues(bot),
    resolver: zodResolver(botInstructionsSchema),
  });

  const previousBotSlugRef = useRef(botSlug);

  useEffect(() => {
    const botChanged = previousBotSlugRef.current !== botSlug;

    if (botChanged || !informationForm.formState.isDirty) {
      informationForm.reset(getInformationValues(bot));
    }
    if (botChanged || !behaviorForm.formState.isDirty) {
      behaviorForm.reset(getBehaviorValues(bot));
    }
    if (botChanged || !instructionsForm.formState.isDirty) {
      instructionsForm.reset(getInstructionsValues(bot));
    }
    previousBotSlugRef.current = botSlug;
  }, [bot, botSlug, behaviorForm, informationForm, instructionsForm]);

  const informationMutation = useEditBotMutation(orgSlug, botSlug);
  const behaviorMutation = useEditBotMutation(orgSlug, botSlug);
  const instructionsMutation = useEditBotMutation(orgSlug, botSlug);
  const isOtherMutationPending =
    informationMutation.isPending ||
    behaviorMutation.isPending ||
    instructionsMutation.isPending;
  const isAnyMutationPending = isChatConfigSaving || isOtherMutationPending;
  const handleChatConfigSavingChange = useCallback((isSaving: boolean) => {
    setIsChatConfigSaving(isSaving);
  }, []);

  function onError(error: Error) {
    toast.add({ title: error.message, type: "error" });
  }

  function showSuccessToast() {
    toast.add({ title: "Bot updated successfully.", type: "success" });
  }

  function onInformationSubmit(values: InformationFormValues) {
    if (isAnyMutationPending) return;

    informationMutation.mutate(
      getEditBotInput(bot, {
        name: values.name,
        description: values.description || null,
      }),
      {
        onError,
        onSuccess: (updatedBot) => {
          informationForm.reset(getInformationValues(updatedBot));
          showSuccessToast();
        },
      },
    );
  }

  function onBehaviorSubmit(values: BehaviorFormValues) {
    if (isAnyMutationPending) return;

    behaviorMutation.mutate(
      getEditBotInput(bot, {
        personality: values.personality,
        language: values.language,
      }),
      {
        onError,
        onSuccess: (updatedBot) => {
          behaviorForm.reset(getBehaviorValues(updatedBot));
          showSuccessToast();
        },
      },
    );
  }

  function onInstructionsSubmit(values: InstructionsFormValues) {
    if (isAnyMutationPending) return;

    instructionsMutation.mutate(
      getEditBotInput(bot, {
        systemMessage: values.systemMessage || null,
      }),
      {
        onError,
        onSuccess: (updatedBot) => {
          instructionsForm.reset(getInstructionsValues(updatedBot));
          showSuccessToast();
        },
      },
    );
  }

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(24rem,26.5rem)]">
      <div className="min-w-0 space-y-6 lg:min-h-0 lg:overflow-y-auto lg:pr-3">
        <form
          noValidate
          onSubmit={informationForm.handleSubmit(onInformationSubmit)}
        >
          <section className="rounded-lg border bg-card p-6">
            <div>
              <h3 className="font-medium">Bot information</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage the name and description used to identify this bot.
              </p>
            </div>

            <div className="mt-6 flex min-w-0 flex-col gap-5">
              <Controller
                control={informationForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={isAnyMutationPending}
                      id={field.name}
                      placeholder="Ex.: Atendimento"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={informationForm.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Description</FieldLabel>
                    <DocumentTextEditor
                      ariaLabel="Bot description"
                      className="mb-0 h-64"
                      hasEmptyTextError={false}
                      isSaving={isAnyMutationPending}
                      markdown={field.value}
                      onChange={field.onChange}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                disabled={
                  isAnyMutationPending || !informationForm.formState.isDirty
                }
                type="submit"
              >
                {isAnyMutationPending ? "Saving..." : "Save changes"}
                {isAnyMutationPending && <ButtonSpinner />}
              </Button>
            </div>
          </section>
        </form>

        <form noValidate onSubmit={behaviorForm.handleSubmit(onBehaviorSubmit)}>
          <section className="rounded-lg border bg-card p-6">
            <div>
              <h3 className="font-medium">Comportamento</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Define how the bot should communicate and which language to use.
              </p>
            </div>

            <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
              <Controller
                control={behaviorForm.control}
                name="personality"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Personalidade</FieldLabel>
                    <Select
                      disabled={isAnyMutationPending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      >
                        <SelectValue placeholder="Select a personality" />
                      </SelectTrigger>
                      <SelectContent>
                        {botPersonalities.map((personality) => (
                          <SelectItem key={personality} value={personality}>
                            {personalityLabels[personality]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={behaviorForm.control}
                name="language"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Idioma</FieldLabel>
                    <Select
                      disabled={isAnyMutationPending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      >
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {botLanguages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                disabled={
                  isAnyMutationPending || !behaviorForm.formState.isDirty
                }
                type="submit"
              >
                {isAnyMutationPending ? "Saving..." : "Save changes"}
                {isAnyMutationPending && <ButtonSpinner />}
              </Button>
            </div>
          </section>
        </form>

        <form
          noValidate
          onSubmit={instructionsForm.handleSubmit(onInstructionsSubmit)}
        >
          <section className="rounded-lg border bg-card p-6">
            <div>
              <h3 className="font-medium">Bot instructions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the main instructions used by the bot when generating
                responses.
              </p>
            </div>

            <div className="mt-6 min-w-0">
              <Controller
                control={instructionsForm.control}
                name="systemMessage"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>System message</FieldLabel>
                    <DocumentTextEditor
                      ariaLabel="Bot system message"
                      className="mb-0 h-80"
                      hasEmptyTextError={false}
                      isSaving={isAnyMutationPending}
                      markdown={field.value}
                      onChange={field.onChange}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                disabled={
                  isAnyMutationPending || !instructionsForm.formState.isDirty
                }
                type="submit"
              >
                {isAnyMutationPending ? "Saving..." : "Save changes"}
                {isAnyMutationPending && <ButtonSpinner />}
              </Button>
            </div>
          </section>
        </form>

        <ChatConfigSection
          bot={bot}
          botSlug={botSlug}
          isOtherMutationPending={isOtherMutationPending}
          onLiveChatConfigChange={handleLiveChatConfigChange}
          onSavingChange={handleChatConfigSavingChange}
          orgSlug={orgSlug}
        />
      </div>

      <aside className="min-w-0 lg:min-h-0 lg:overflow-hidden">
        <div className="lg:sticky lg:top-0 lg:self-start">
          <BotChat
            botSlug={botSlug}
            chatConfig={liveChatConfig}
            onOpenEmbed={onOpenEmbed}
            orgSlug={orgSlug}
          />
        </div>
      </aside>
    </div>
  );
}
