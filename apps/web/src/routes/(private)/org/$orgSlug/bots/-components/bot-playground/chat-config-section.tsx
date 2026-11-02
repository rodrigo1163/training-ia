import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEditChatConfigMutation } from "@/hooks/use-bots";
import type { Bot, ChatConfig, ChatConfigPatch } from "@/api/bots/types";
import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
  STARTER_QUESTIONS_MODEL_ID,
} from "@training-ia/contracts";
import { toast } from "@training-ia/ui/components/ui/toast";

import { AiConfigurationSection } from "./ai-configuration-section";
import { ChatAvatarSection } from "./chat-avatar-section";
import { ChatConfigurationSection } from "./chat-configuration-section";
import {
  chatConfigSchema,
  getChatConfigValues,
  hasDirtyStarterQuestions,
  toNullableText,
  type ChatConfigFormValues,
} from "./form-utils";

export function ChatConfigSection({
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
      <ChatAvatarSection bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
      <ChatConfigurationSection form={chatForm} isSaving={isSaving} />
      <AiConfigurationSection
        form={chatForm}
        isSaving={isSaving}
        primaryModelDefinition={primaryModelDefinition}
        suggestionsModel={suggestionsModel}
      />
    </form>
  );
}
