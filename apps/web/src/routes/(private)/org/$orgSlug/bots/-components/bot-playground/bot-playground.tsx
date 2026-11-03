import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEditBotMutation } from "@/hooks/use-bots";
import type {
  Bot,
  ChatTheme,
  ChatWidgetConfig,
  EditBotInput,
} from "@/api/bots/types";
import { toast } from "@training-ia/ui/components/ui/toast";
import { Button } from "@training-ia/ui/components/ui/button";

import { BotChat } from "../bot-chat";
import { useBotChatFollow } from "../../-hooks/use-bot-chat-follow";
import {
  botBehaviorSchema,
  botInformationSchema,
  botInstructionsSchema,
  getBehaviorValues,
  getInformationValues,
  getInstructionsValues,
  type BehaviorFormValues,
  type InformationFormValues,
  type InstructionsFormValues,
} from "./form-utils";
import { BotPlaygroundSections } from "./sections";

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
  const [liveChatConfig, setLiveChatConfig] = useState<ChatWidgetConfig>({
    ...bot.chatConfig,
    style: bot.style,
  });
  const [previewTheme, setPreviewTheme] = useState<ChatTheme>("light");
  const [isChatConfigSaving, setIsChatConfigSaving] = useState(false);
  const handleLiveChatConfigChange = useCallback((config: ChatWidgetConfig) => {
    setLiveChatConfig((current) =>
      JSON.stringify(current) === JSON.stringify(config) ? current : config,
    );
  }, []);

  useEffect(() => {
    setLiveChatConfig({ ...bot.chatConfig, style: bot.style });
  }, [bot.chatConfig, bot.style]);

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

  const {
    boundaryRef,
    chatRef,
    chatStyle,
    slotRef,
    toolbarRef,
    toolbarStyle,
  } = useBotChatFollow();

  return (
    <div
      className="grid min-w-0 flex-1 grid-cols-1 lg:items-start lg:grid-cols-[minmax(0,1fr)_minmax(24rem,26.5rem)]"
      ref={boundaryRef}
    >
      <div className="min-w-0 lg:pr-3">
        <BotPlaygroundSections
          behaviorForm={behaviorForm}
          bot={bot}
          botSlug={botSlug}
          informationForm={informationForm}
          instructionsForm={instructionsForm}
          isAnyMutationPending={isAnyMutationPending}
          isOtherMutationPending={isOtherMutationPending}
          onBehaviorSubmit={onBehaviorSubmit}
          onChatConfigSavingChange={handleChatConfigSavingChange}
          onInformationSubmit={onInformationSubmit}
          onInstructionsSubmit={onInstructionsSubmit}
          onLiveChatConfigChange={handleLiveChatConfigChange}
          onPreviewThemeChange={setPreviewTheme}
          orgSlug={orgSlug}
          previewTheme={previewTheme}
        />
      </div>

      <aside className="min-w-0 lg:self-start">
        <div className="min-w-0 lg:min-h-[32rem]" ref={slotRef}>
          <div
            className="mb-3 flex items-center justify-between gap-3"
            ref={toolbarRef}
            style={toolbarStyle}
          >
            <div>
              <p className="text-xs text-muted-foreground">
                Preview theme: {previewTheme === "light" ? "Light" : "Dark"}
              </p>
            </div>
            <div
              aria-label="Preview theme"
              className="flex gap-2"
              role="group"
            >
              {(["light", "dark"] as const).map((theme) => (
                <Button
                  aria-pressed={previewTheme === theme}
                  key={theme}
                  onClick={() => setPreviewTheme(theme)}
                  size="sm"
                  type="button"
                  variant={previewTheme === theme ? "default" : "outline"}
                >
                  {theme === "light" ? "Light" : "Dark"}
                </Button>
              ))}
            </div>
          </div>
          <div className="w-full" ref={chatRef} style={chatStyle}>
            <BotChat
              botSlug={botSlug}
              chatConfig={liveChatConfig}
              onOpenEmbed={onOpenEmbed}
              orgSlug={orgSlug}
              previewTheme={previewTheme}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
