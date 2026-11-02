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
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";
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

const chatConfigSchema = z
  .object({
    inputPlaceholder: z.string(),
    submitButtonText: z.string(),
    showMessageTimestamps: z.boolean(),
    starterQuestions: starterQuestionsSchema,
    initialMessage: z.string(),
    headerStatusText: z.string(),
    chatBackgroundColor: chatColorSchema,
    headerFooterBackgroundColor: chatColorSchema,
    assistantMessageBackgroundColor: chatColorSchema,
    userMessageBackgroundColor: chatColorSchema,
    model: chatModelSchema,
    temperature: nullableTemperatureSchema,
    maxTokens: nullableMaxTokensSchema,
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
    chatBackgroundColor: config.chatBackgroundColor ?? "",
    headerFooterBackgroundColor: config.headerFooterBackgroundColor ?? "",
    assistantMessageBackgroundColor:
      config.assistantMessageBackgroundColor ?? "",
    userMessageBackgroundColor: config.userMessageBackgroundColor ?? "",
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    generateStarterQuestionsAfterResponse:
      config.generateStarterQuestionsAfterResponse,
  };
}

function toNullableText(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function ChatConfigSection({
  bot,
  botSlug,
  onLiveChatConfigChange,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  onLiveChatConfigChange: (config: ChatConfig) => void;
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
      generateStarterQuestionsAfterResponse:
        liveValues.generateStarterQuestionsAfterResponse ?? false,
    }),
    [bot.chatConfig, liveValues],
  );

  useEffect(() => {
    onLiveChatConfigChange(liveChatConfig);
  }, [liveChatConfig, onLiveChatConfigChange]);

  useEffect(() => {
    const botChanged = previousBotSlugRef.current !== botSlug;

    if (botChanged || !chatForm.formState.isDirty) {
      chatForm.reset(getChatConfigValues(bot.chatConfig));
    }
    previousBotSlugRef.current = botSlug;
  }, [botSlug, bot.chatConfig, chatForm]);

  function onSubmit(values: ChatConfigFormValues) {
    const patch: ChatConfigPatch = {
      inputPlaceholder: toNullableText(values.inputPlaceholder),
      submitButtonText: toNullableText(values.submitButtonText),
      showMessageTimestamps: values.showMessageTimestamps,
      starterQuestions: values.starterQuestions
        .map(({ value }) => value.trim())
        .filter(Boolean),
      initialMessage: toNullableText(values.initialMessage),
      headerStatusText: toNullableText(values.headerStatusText),
      chatBackgroundColor: toNullableText(values.chatBackgroundColor),
      headerFooterBackgroundColor: toNullableText(
        values.headerFooterBackgroundColor,
      ),
      assistantMessageBackgroundColor: toNullableText(
        values.assistantMessageBackgroundColor,
      ),
      userMessageBackgroundColor: toNullableText(
        values.userMessageBackgroundColor,
      ),
      model: values.model,
      temperature: values.temperature,
      maxTokens: values.maxTokens,
      generateStarterQuestionsAfterResponse:
        values.generateStarterQuestionsAfterResponse,
    };

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
          <h3 className="font-medium">Chat configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes are saved when you click Save changes.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <ChatAvatarPicker bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="header-status"
          >
            Header status
            <Input
              {...chatForm.register("headerStatusText")}
              disabled={chatConfigMutation.isPending}
              id="header-status"
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
              disabled={chatConfigMutation.isPending}
              id="input-placeholder"
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
              disabled={chatConfigMutation.isPending}
              id="submit-text"
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
              disabled={chatConfigMutation.isPending}
              id="initial-message"
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
                  disabled={chatConfigMutation.isPending}
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
              disabled={chatConfigMutation.isPending || fields.length >= 3}
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
                    disabled={chatConfigMutation.isPending}
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
                  disabled={chatConfigMutation.isPending}
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
                  <Input
                    {...inputField}
                    aria-invalid={fieldState.invalid}
                    disabled={chatConfigMutation.isPending}
                    id={inputField.name}
                    placeholder="#ffffff, rgb(...) or hsl(...)"
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
                  disabled={chatConfigMutation.isPending}
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
                <FieldLabel htmlFor={field.name}>Temperature</FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  disabled={
                    chatConfigMutation.isPending ||
                    !primaryModelDefinition.supportsTemperature
                  }
                  id={field.name}
                  max={2}
                  min={0}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === "" ? null : Number(value));
                  }}
                  ref={field.ref}
                  step={0.1}
                  type="number"
                  value={field.value ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Supported values range from 0 to 2.
                </p>
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
                  <FieldLabel htmlFor={field.name}>Max tokens</FieldLabel>
                  <Input
                    aria-invalid={fieldState.invalid}
                    disabled={
                      chatConfigMutation.isPending ||
                      !primaryModelDefinition.supportsMaxTokens
                    }
                    id={field.name}
                    max={maxTokensLimit}
                    min={1}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? null : Number(value));
                    }}
                    ref={field.ref}
                    step={1}
                    type="number"
                    value={field.value ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Positive integers up to {maxTokensLimit}.
                  </p>
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
                    disabled={chatConfigMutation.isPending}
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
          <p className="mb-3 text-xs text-muted-foreground">
            Usage limits are reserved for a future configuration update.
          </p>
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <label
              className="space-y-2 text-sm font-medium"
              htmlFor="daily-limit"
            >
              Max messages per day
              <Input
                disabled
                id="daily-limit"
                min="1"
                placeholder="Unlimited"
                type="number"
                value={bot.chatConfig.maxMessagesPerDay ?? ""}
              />
            </label>
            <label
              className="space-y-2 text-sm font-medium"
              htmlFor="conversation-limit"
            >
              Max user messages per conversation
              <Input
                disabled
                id="conversation-limit"
                min="1"
                placeholder="Unlimited"
                type="number"
                value={bot.chatConfig.maxUserMessagesPerConversation ?? ""}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={
              chatConfigMutation.isPending ||
              !chatForm.formState.isDirty ||
              !chatForm.formState.isValid
            }
            type="submit"
          >
            {chatConfigMutation.isPending ? "Saving..." : "Save changes"}
            {chatConfigMutation.isPending && <ButtonSpinner />}
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

  useEffect(() => {
    if (!informationForm.formState.isDirty) {
      informationForm.reset(getInformationValues(bot));
    }
  }, [bot.name, bot.description, informationForm]);

  useEffect(() => {
    if (!behaviorForm.formState.isDirty) {
      behaviorForm.reset(getBehaviorValues(bot));
    }
  }, [bot.personality, bot.language, behaviorForm]);

  useEffect(() => {
    if (!instructionsForm.formState.isDirty) {
      instructionsForm.reset(getInstructionsValues(bot));
    }
  }, [bot.systemMessage, instructionsForm]);

  const informationMutation = useEditBotMutation(orgSlug, botSlug);
  const behaviorMutation = useEditBotMutation(orgSlug, botSlug);
  const instructionsMutation = useEditBotMutation(orgSlug, botSlug);

  function onError(error: Error) {
    toast.add({ title: error.message, type: "error" });
  }

  function showSuccessToast() {
    toast.add({ title: "Bot updated successfully.", type: "success" });
  }

  function onInformationSubmit(values: InformationFormValues) {
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
                      disabled={informationMutation.isPending}
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
                      isSaving={informationMutation.isPending}
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
                  informationMutation.isPending ||
                  !informationForm.formState.isDirty
                }
                type="submit"
              >
                {informationMutation.isPending ? "Saving..." : "Save changes"}
                {informationMutation.isPending && <ButtonSpinner />}
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
                      disabled={behaviorMutation.isPending}
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
                      disabled={behaviorMutation.isPending}
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
                  behaviorMutation.isPending || !behaviorForm.formState.isDirty
                }
                type="submit"
              >
                {behaviorMutation.isPending ? "Saving..." : "Save changes"}
                {behaviorMutation.isPending && <ButtonSpinner />}
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
                      isSaving={instructionsMutation.isPending}
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
                  instructionsMutation.isPending ||
                  !instructionsForm.formState.isDirty
                }
                type="submit"
              >
                {instructionsMutation.isPending ? "Saving..." : "Save changes"}
                {instructionsMutation.isPending && <ButtonSpinner />}
              </Button>
            </div>
          </section>
        </form>

        <ChatConfigSection
          bot={bot}
          botSlug={botSlug}
          onLiveChatConfigChange={handleLiveChatConfigChange}
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
