import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEditChatConfigMutation } from "@/hooks/use-bots";
import type {
  Bot,
  BotStyle,
  ChatColorPalette,
  ChatConfigPatch,
  ChatTheme,
  ChatWidgetConfig,
} from "@/api/bots/types";
import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
  STARTER_QUESTIONS_MODEL_ID,
} from "@training-ia/contracts";
import { toast } from "@training-ia/ui/components/ui/toast";

import { AiConfigurationSection } from "./ai-configuration-section";
import { ChatAvatarSection } from "./chat-avatar-section";
import { ChatConfigurationSection } from "./chat-configuration-section";
import { ChatStyleSection } from "./chat-style-section";
import { StarterQuestionsSection } from "./starter-questions-section";
import {
  chatConfigSchema,
  getChatConfigValues,
  hasDirtyStarterQuestions,
  toNullableText,
  type ChatConfigFormValues,
} from "./form-utils";

const chatColorFields = [
  "chatBackgroundColor",
  "headerFooterBackgroundColor",
  "footerBackgroundColor",
  "inputBackgroundColor",
  "inputTextColor",
  "starterQuestionsTextColor",
  "assistantMessageBackgroundColor",
  "assistantMessageTextColor",
  "userMessageBackgroundColor",
  "userMessageTextColor",
  "launcherBackgroundColor",
  "chatBorderColor",
] as const satisfies readonly (keyof ChatColorPalette)[];

function toPalette(
  values: ChatConfigFormValues["style"]["colors"]["light"],
): ChatColorPalette {
  return {
    chatBackgroundColor: toNullableText(values.chatBackgroundColor),
    headerFooterBackgroundColor: toNullableText(
      values.headerFooterBackgroundColor,
    ),
    footerBackgroundColor: toNullableText(values.footerBackgroundColor),
    inputBackgroundColor: toNullableText(values.inputBackgroundColor),
    inputTextColor: toNullableText(values.inputTextColor),
    starterQuestionsTextColor: toNullableText(values.starterQuestionsTextColor),
    assistantMessageBackgroundColor: toNullableText(
      values.assistantMessageBackgroundColor,
    ),
    assistantMessageTextColor: toNullableText(values.assistantMessageTextColor),
    userMessageBackgroundColor: toNullableText(
      values.userMessageBackgroundColor,
    ),
    userMessageTextColor: toNullableText(values.userMessageTextColor),
    launcherBackgroundColor: toNullableText(values.launcherBackgroundColor),
    chatBorderColor: toNullableText(values.chatBorderColor),
  };
}

export function ChatConfigSection({
  bot,
  botSlug,
  isOtherMutationPending,
  onPreviewThemeChange,
  onLiveChatConfigChange,
  onSavingChange,
  orgSlug,
  previewTheme,
}: {
  bot: Bot;
  botSlug: string;
  isOtherMutationPending: boolean;
  onPreviewThemeChange: (theme: ChatTheme) => void;
  onLiveChatConfigChange: (config: ChatWidgetConfig) => void;
  onSavingChange: (isSaving: boolean) => void;
  orgSlug: string;
  previewTheme: ChatTheme;
}) {
  const chatConfigMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const chatForm = useForm<ChatConfigFormValues>({
    defaultValues: getChatConfigValues(bot.chatConfig, bot.style),
    mode: "onChange",
    resolver: zodResolver(chatConfigSchema),
  });
  const isSaving = chatConfigMutation.isPending || isOtherMutationPending;
  const previousBotSlugRef = useRef(botSlug);
  const liveValues = useWatch({ control: chatForm.control });
  const liveStyleValues = useWatch({
    control: chatForm.control,
    name: "style",
  });
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
    (): ChatWidgetConfig => ({
      ...bot.chatConfig,
      inputPlaceholder: toNullableText(liveValues.inputPlaceholder ?? ""),
      submitButtonText: toNullableText(liveValues.submitButtonText ?? ""),
      showMessageTimestamps: liveValues.showMessageTimestamps ?? false,
      starterQuestions: (liveValues.starterQuestions ?? [])
        .map(({ value }) => (value ?? "").trim())
        .filter(Boolean),
      initialMessage: toNullableText(liveValues.initialMessage ?? ""),
      assistantName: toNullableText(liveValues.assistantName ?? ""),
      headerStatusText: toNullableText(liveValues.headerStatusText ?? ""),
      style: {
        colors: {
          light: toPalette(liveStyleValues.colors.light),
          dark: toPalette(liveStyleValues.colors.dark),
        },
        avatarUrl: bot.style.avatarUrl,
        launcherSize: liveStyleValues.launcherSize,
        launcherIcon: liveStyleValues.launcherIcon,
        chatBorderWidth: liveStyleValues.chatBorderWidth,
        chatFontFamily: liveStyleValues.chatFontFamily,
        chatMessageFontSize: liveStyleValues.chatMessageFontSize,
        chatWidth: liveStyleValues.chatWidth,
        chatHeight: liveStyleValues.chatHeight,
        chatRadius: liveStyleValues.chatRadius,
        messageRadius: liveStyleValues.messageRadius,
        chatShadow: liveStyleValues.chatShadow,
        floatingPosition: liveStyleValues.floatingPosition,
      },
      generateStarterQuestionsAfterResponse:
        liveValues.generateStarterQuestionsAfterResponse ?? false,
    }),
    [bot.chatConfig, liveStyleValues, liveValues],
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
      chatForm.reset(getChatConfigValues(bot.chatConfig, bot.style));
    }
    previousBotSlugRef.current = botSlug;
  }, [botSlug, bot.chatConfig, bot.style, chatForm]);

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
    if (dirtyFields.assistantName) {
      patch.assistantName = toNullableText(values.assistantName);
    }
    if (dirtyFields.headerStatusText) {
      patch.headerStatusText = toNullableText(values.headerStatusText);
    }

    if (dirtyFields.style) {
      const stylePatch: BotStyle = {
        ...bot.style,
        colors: {
          light: { ...bot.style.colors.light },
          dark: { ...bot.style.colors.dark },
        },
      };

      for (const theme of ["light", "dark"] as const) {
        for (const field of chatColorFields) {
          if (dirtyFields.style.colors?.[theme]?.[field]) {
            stylePatch.colors[theme][field] = toNullableText(
              values.style.colors[theme][field],
            );
          }
        }
      }

      if (dirtyFields.style.launcherSize) {
        stylePatch.launcherSize = values.style.launcherSize;
      }
      if (dirtyFields.style.launcherIcon) {
        stylePatch.launcherIcon = values.style.launcherIcon;
      }
      if (dirtyFields.style.chatBorderWidth) {
        stylePatch.chatBorderWidth = values.style.chatBorderWidth;
      }
      if (dirtyFields.style.chatFontFamily) {
        stylePatch.chatFontFamily = values.style.chatFontFamily;
      }
      if (dirtyFields.style.chatMessageFontSize) {
        stylePatch.chatMessageFontSize = values.style.chatMessageFontSize;
      }
      if (dirtyFields.style.chatWidth) {
        stylePatch.chatWidth = values.style.chatWidth;
      }
      if (dirtyFields.style.chatHeight) {
        stylePatch.chatHeight = values.style.chatHeight;
      }
      if (dirtyFields.style.chatRadius) {
        stylePatch.chatRadius = values.style.chatRadius;
      }
      if (dirtyFields.style.messageRadius) {
        stylePatch.messageRadius = values.style.messageRadius;
      }
      if (dirtyFields.style.chatShadow) {
        stylePatch.chatShadow = values.style.chatShadow;
      }
      if (dirtyFields.style.floatingPosition) {
        stylePatch.floatingPosition = values.style.floatingPosition;
      }

      patch.style = stylePatch;
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
        chatForm.reset(
          getChatConfigValues(updatedBot.chatConfig, updatedBot.style),
        );
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
      <StarterQuestionsSection form={chatForm} isSaving={isSaving} />
        <ChatStyleSection
          form={chatForm}
          isSaving={isSaving}
          onPaletteThemeChange={onPreviewThemeChange}
          paletteTheme={previewTheme}
        />
      <AiConfigurationSection
        form={chatForm}
        isSaving={isSaving}
        primaryModelDefinition={primaryModelDefinition}
        suggestionsModel={suggestionsModel}
      />
    </form>
  );
}
