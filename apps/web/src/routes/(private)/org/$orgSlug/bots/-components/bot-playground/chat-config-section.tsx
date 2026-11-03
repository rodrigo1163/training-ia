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
  aiConfigurationSchema,
  chatConfigurationSchema,
  chatStyleFormSchema,
  getAiConfigurationValues,
  getChatConfigurationValues,
  getChatStyleValues,
  getStarterQuestionsValues,
  starterQuestionsFormSchema,
  toNullableText,
  type AiConfigurationFormValues,
  type ChatConfigurationFormValues,
  type ChatStyleFormValues,
  type StarterQuestionsFormValues,
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
  values: ChatStyleFormValues["style"]["colors"]["light"],
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
  const chatConfigurationMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const starterQuestionsMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const chatStyleMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const aiConfigurationMutation = useEditChatConfigMutation(orgSlug, botSlug);
  const chatConfigurationForm = useForm<ChatConfigurationFormValues>({
    defaultValues: getChatConfigurationValues(bot.chatConfig),
    mode: "onChange",
    resolver: zodResolver(chatConfigurationSchema),
  });
  const starterQuestionsForm = useForm<StarterQuestionsFormValues>({
    defaultValues: getStarterQuestionsValues(bot.chatConfig),
    mode: "onChange",
    resolver: zodResolver(starterQuestionsFormSchema),
  });
  const chatStyleForm = useForm<ChatStyleFormValues>({
    defaultValues: getChatStyleValues(bot.style),
    mode: "onChange",
    resolver: zodResolver(chatStyleFormSchema),
  });
  const aiConfigurationForm = useForm<AiConfigurationFormValues>({
    defaultValues: getAiConfigurationValues(bot.chatConfig),
    mode: "onChange",
    resolver: zodResolver(aiConfigurationSchema),
  });
  const isAnyChatConfigMutationPending =
    chatConfigurationMutation.isPending ||
    starterQuestionsMutation.isPending ||
    chatStyleMutation.isPending ||
    aiConfigurationMutation.isPending;
  const isSavingDisabled =
    isOtherMutationPending || isAnyChatConfigMutationPending;
  const previousBotSlugRef = useRef(botSlug);
  const chatConfigurationValues = useWatch({
    control: chatConfigurationForm.control,
  });
  const starterQuestionsValues = useWatch({
    control: starterQuestionsForm.control,
  });
  const chatStyleValues = useWatch({
    control: chatStyleForm.control,
    name: "style",
  });
  const aiConfigurationValues = useWatch({
    control: aiConfigurationForm.control,
  });
  const selectedModel = aiConfigurationValues.model ?? null;
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
      aiConfigurationValues.temperature !== null
    ) {
      aiConfigurationForm.setValue("temperature", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (
      !primaryModelDefinition.supportsMaxTokens &&
      aiConfigurationValues.maxTokens !== null
    ) {
      aiConfigurationForm.setValue("maxTokens", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    aiConfigurationForm,
    aiConfigurationValues.maxTokens,
    aiConfigurationValues.temperature,
    primaryModelDefinition,
  ]);

  const liveChatConfig = useMemo(
    (): ChatWidgetConfig => ({
      ...bot.chatConfig,
      inputPlaceholder: toNullableText(
        chatConfigurationValues.inputPlaceholder ?? "",
      ),
      submitButtonText: toNullableText(
        chatConfigurationValues.submitButtonText ?? "",
      ),
      showMessageTimestamps:
        chatConfigurationValues.showMessageTimestamps ?? false,
      starterQuestions: (starterQuestionsValues.starterQuestions ?? [])
        .map(({ value }) => (value ?? "").trim())
        .filter(Boolean),
      initialMessage: toNullableText(
        chatConfigurationValues.initialMessage ?? "",
      ),
      assistantName: toNullableText(
        chatConfigurationValues.assistantName ?? "",
      ),
      headerStatusText: toNullableText(
        chatConfigurationValues.headerStatusText ?? "",
      ),
      generateStarterQuestionsAfterResponse:
        aiConfigurationValues.generateStarterQuestionsAfterResponse ?? false,
      style: {
        colors: {
          light: toPalette(chatStyleValues.colors.light),
          dark: toPalette(chatStyleValues.colors.dark),
        },
        avatarUrl: bot.style.avatarUrl,
        launcherSize: chatStyleValues.launcherSize,
        launcherIcon: chatStyleValues.launcherIcon,
        chatBorderWidth: chatStyleValues.chatBorderWidth,
        chatFontFamily: chatStyleValues.chatFontFamily,
        chatMessageFontSize: chatStyleValues.chatMessageFontSize,
        chatWidth: chatStyleValues.chatWidth,
        chatHeight: chatStyleValues.chatHeight,
        chatRadius: chatStyleValues.chatRadius,
        messageRadius: chatStyleValues.messageRadius,
        chatShadow: chatStyleValues.chatShadow,
        floatingPosition: chatStyleValues.floatingPosition,
      },
    }),
    [
      aiConfigurationValues.generateStarterQuestionsAfterResponse,
      bot.chatConfig,
      bot.style.avatarUrl,
      chatConfigurationValues,
      chatStyleValues,
      starterQuestionsValues,
    ],
  );

  useEffect(() => {
    onLiveChatConfigChange(liveChatConfig);
  }, [liveChatConfig, onLiveChatConfigChange]);

  useEffect(() => {
    onSavingChange(isAnyChatConfigMutationPending);
  }, [isAnyChatConfigMutationPending, onSavingChange]);

  useEffect(() => {
    const botChanged = previousBotSlugRef.current !== botSlug;

    if (botChanged || !chatConfigurationForm.formState.isDirty) {
      chatConfigurationForm.reset(getChatConfigurationValues(bot.chatConfig));
    }
    if (botChanged || !starterQuestionsForm.formState.isDirty) {
      starterQuestionsForm.reset(getStarterQuestionsValues(bot.chatConfig));
    }
    if (botChanged || !chatStyleForm.formState.isDirty) {
      chatStyleForm.reset(getChatStyleValues(bot.style));
    }
    if (botChanged || !aiConfigurationForm.formState.isDirty) {
      aiConfigurationForm.reset(getAiConfigurationValues(bot.chatConfig));
    }
    previousBotSlugRef.current = botSlug;
  }, [
    botSlug,
    bot.chatConfig,
    bot.style,
    chatConfigurationForm,
    starterQuestionsForm,
    chatStyleForm,
    aiConfigurationForm,
  ]);

  function saveChatConfigPatch(
    mutation: ReturnType<typeof useEditChatConfigMutation>,
    patch: ChatConfigPatch,
    resetForm: (updatedBot: Bot) => void,
  ) {
    if (isSavingDisabled || Object.keys(patch).length === 0) return;

    mutation.mutate(patch, {
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
      onSuccess: (updatedBot) => {
        resetForm(updatedBot);
        toast.add({
          title: "Chat configuration saved successfully.",
          type: "success",
        });
      },
    });
  }

  function onChatConfigurationSubmit(values: ChatConfigurationFormValues) {
    const dirtyFields = chatConfigurationForm.formState.dirtyFields;
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
    if (dirtyFields.initialMessage) {
      patch.initialMessage = toNullableText(values.initialMessage);
    }
    if (dirtyFields.assistantName) {
      patch.assistantName = toNullableText(values.assistantName);
    }
    if (dirtyFields.headerStatusText) {
      patch.headerStatusText = toNullableText(values.headerStatusText);
    }

    saveChatConfigPatch(chatConfigurationMutation, patch, (updatedBot) =>
      chatConfigurationForm.reset(
        getChatConfigurationValues(updatedBot.chatConfig),
      ),
    );
  }

  function onStarterQuestionsSubmit(values: StarterQuestionsFormValues) {
    const patch: ChatConfigPatch = {};

    if (starterQuestionsForm.formState.isDirty) {
      patch.starterQuestions = values.starterQuestions
        .map(({ value }) => value.trim())
        .filter(Boolean);
    }

    saveChatConfigPatch(starterQuestionsMutation, patch, (updatedBot) =>
      starterQuestionsForm.reset(
        getStarterQuestionsValues(updatedBot.chatConfig),
      ),
    );
  }

  function onChatStyleSubmit(values: ChatStyleFormValues) {
    const dirtyFields = chatStyleForm.formState.dirtyFields;
    const patch: ChatConfigPatch = {};

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

    saveChatConfigPatch(chatStyleMutation, patch, (updatedBot) =>
      chatStyleForm.reset(getChatStyleValues(updatedBot.style)),
    );
  }

  function onAiConfigurationSubmit(values: AiConfigurationFormValues) {
    const dirtyFields = aiConfigurationForm.formState.dirtyFields;
    const patch: ChatConfigPatch = {};

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

    saveChatConfigPatch(aiConfigurationMutation, patch, (updatedBot) =>
      aiConfigurationForm.reset(
        getAiConfigurationValues(updatedBot.chatConfig),
      ),
    );
  }

  return (
    <div>
      <ChatAvatarSection bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
      <ChatConfigurationSection
        form={chatConfigurationForm}
        isDisabled={isSavingDisabled}
        isSaving={chatConfigurationMutation.isPending}
        onSubmit={onChatConfigurationSubmit}
      />
      <StarterQuestionsSection
        form={starterQuestionsForm}
        isDisabled={isSavingDisabled}
        isSaving={starterQuestionsMutation.isPending}
        onSubmit={onStarterQuestionsSubmit}
      />
      <ChatStyleSection
        form={chatStyleForm}
        isDisabled={isSavingDisabled}
        isSaving={chatStyleMutation.isPending}
        onPaletteThemeChange={onPreviewThemeChange}
        onSubmit={onChatStyleSubmit}
        paletteTheme={previewTheme}
      />
      <AiConfigurationSection
        form={aiConfigurationForm}
        isDisabled={isSavingDisabled}
        isSaving={aiConfigurationMutation.isPending}
        onSubmit={onAiConfigurationSubmit}
        primaryModelDefinition={primaryModelDefinition}
        suggestionsModel={suggestionsModel}
      />
    </div>
  );
}
