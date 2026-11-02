import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useEditBotMutation,
} from "@/hooks/use-bots";
import type {
  Bot,
  ChatConfig,
  EditBotInput,
} from "@/api/bots/types";
import { toast } from "@training-ia/ui/components/ui/toast";

import { BotChat } from "../bot-chat";
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
      <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-3">
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
