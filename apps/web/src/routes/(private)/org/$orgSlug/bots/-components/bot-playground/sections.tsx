import type { UseFormReturn } from "react-hook-form";

import type { Bot, ChatTheme, ChatWidgetConfig } from "@/api/bots/types";

import { BotBehaviorSection } from "./bot-behavior-section";
import { BotInformationSection } from "./bot-information-section";
import { BotInstructionsSection } from "./bot-instructions-section";
import { ChatConfigSection } from "./chat-config-section";
import type {
  BehaviorFormValues,
  InformationFormValues,
  InstructionsFormValues,
} from "./form-utils";

type BotPlaygroundSectionsProps = {
  bot: Bot;
  botSlug: string;
  behaviorForm: UseFormReturn<BehaviorFormValues>;
  informationForm: UseFormReturn<InformationFormValues>;
  instructionsForm: UseFormReturn<InstructionsFormValues>;
  isAnyMutationPending: boolean;
  isBehaviorSaving: boolean;
  isInformationSaving: boolean;
  isInstructionsSaving: boolean;
  isOtherMutationPending: boolean;
  onBehaviorSubmit: (values: BehaviorFormValues) => void;
  onChatConfigSavingChange: (isSaving: boolean) => void;
  onInformationSubmit: (values: InformationFormValues) => void;
  onInstructionsSubmit: (values: InstructionsFormValues) => void;
  onLiveChatConfigChange: (config: ChatWidgetConfig) => void;
  onPreviewThemeChange: (theme: ChatTheme) => void;
  orgSlug: string;
  previewTheme: ChatTheme;
};

export function BotPlaygroundSections({
  bot,
  botSlug,
  behaviorForm,
  informationForm,
  instructionsForm,
  isAnyMutationPending,
  isBehaviorSaving,
  isInformationSaving,
  isInstructionsSaving,
  isOtherMutationPending,
  onBehaviorSubmit,
  onChatConfigSavingChange,
  onInformationSubmit,
  onInstructionsSubmit,
  onLiveChatConfigChange,
  onPreviewThemeChange,
  orgSlug,
  previewTheme,
}: BotPlaygroundSectionsProps) {
  return (
    <div className="min-w-0 space-y-6">
      <BotInformationSection
        form={informationForm}
        isDisabled={isAnyMutationPending}
        isSaving={isInformationSaving}
        onSubmit={onInformationSubmit}
      />
      <BotBehaviorSection
        form={behaviorForm}
        isDisabled={isAnyMutationPending}
        isSaving={isBehaviorSaving}
        onSubmit={onBehaviorSubmit}
      />
      <BotInstructionsSection
        form={instructionsForm}
        isDisabled={isAnyMutationPending}
        isSaving={isInstructionsSaving}
        onSubmit={onInstructionsSubmit}
      />
      <ChatConfigSection
        bot={bot}
        botSlug={botSlug}
        isOtherMutationPending={isOtherMutationPending}
        onLiveChatConfigChange={onLiveChatConfigChange}
        onPreviewThemeChange={onPreviewThemeChange}
        onSavingChange={onChatConfigSavingChange}
        orgSlug={orgSlug}
        previewTheme={previewTheme}
      />
    </div>
  );
}
