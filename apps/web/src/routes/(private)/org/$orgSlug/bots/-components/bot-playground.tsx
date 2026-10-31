import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ButtonSpinner } from "@/components/button-spinner";
import { useEditBotMutation } from "@/hooks/use-bots";
import { useChatConfigAutosave } from "@/hooks/use-chat-config-autosave";
import { DocumentTextEditor } from "./document-text-editor";
import {
  botLanguages,
  botPersonalities,
  type Bot,
  type BotPersonality,
  type EditBotInput,
} from "@/api/bots/types";
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
type StarterQuestionsFormValues = {
  starterQuestions: { value: string }[];
};

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

function ChatConfigSection({
  bot,
  botSlug,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  orgSlug: string;
}) {
  const { config, error, status, update } = useChatConfigAutosave(
    orgSlug,
    botSlug,
    bot.chatConfig,
  );
  const starterForm = useForm<StarterQuestionsFormValues>({
    defaultValues: {
      starterQuestions: config.starterQuestions.map((value) => ({ value })),
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: starterForm.control,
    name: "starterQuestions",
  });
  const { reset: resetStarterForm } = starterForm;
  const previousErrorRef = useRef<Error | null>(null);
  const starterQuestions = starterForm.watch("starterQuestions");
  const starterQuestionsKey = JSON.stringify(starterQuestions);

  useEffect(() => {
    update({
      starterQuestions: starterQuestions
        .map(({ value }) => value)
        .filter((value) => value.trim()),
    });
    // The serialized value is intentional: react-hook-form returns a new
    // array while the user edits a field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterQuestionsKey]);

  useEffect(() => {
    if (!error) {
      previousErrorRef.current = null;
      return;
    }

    if (error === previousErrorRef.current) return;

    previousErrorRef.current = error;

    resetStarterForm({
      starterQuestions: config.starterQuestions.map((value) => ({
        value,
      })),
    });
  }, [config.starterQuestions, error, resetStarterForm]);

  function updateText(
    field:
      | "avatarUrl"
      | "inputPlaceholder"
      | "submitButtonText"
      | "initialMessage"
      | "headerStatusText"
      | "chatBackgroundColor"
      | "headerFooterBackgroundColor"
      | "assistantMessageBackgroundColor"
      | "userMessageBackgroundColor",
    value: string,
  ) {
    update({ [field]: value || null });
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Chat configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes are previewed immediately and saved automatically.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground" role="status">
          {status === "saving"
            ? "Saving..."
            : status === "pending"
              ? "Waiting to save"
              : status === "error"
                ? "Unable to save"
                : status === "saved"
                  ? "Saved"
                  : "All changes saved"}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error.message}</p>}

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium" htmlFor="avatar-url">
          Avatar URL
          <Input
            id="avatar-url"
            value={config.avatarUrl ?? ""}
            onChange={(event) => updateText("avatarUrl", event.target.value)}
            placeholder="https://example.com/avatar.webp"
          />
        </label>
        <label className="space-y-2 text-sm font-medium" htmlFor="header-status">
          Header status
          <Input
            id="header-status"
            value={config.headerStatusText ?? ""}
            onChange={(event) =>
              updateText("headerStatusText", event.target.value)
            }
            placeholder="We are online"
          />
        </label>
        <label className="space-y-2 text-sm font-medium" htmlFor="input-placeholder">
          Input placeholder
          <Input
            id="input-placeholder"
            value={config.inputPlaceholder ?? ""}
            onChange={(event) =>
              updateText("inputPlaceholder", event.target.value)
            }
            placeholder="Type your message..."
          />
        </label>
        <label className="space-y-2 text-sm font-medium" htmlFor="submit-text">
          Submit button text
          <Input
            id="submit-text"
            value={config.submitButtonText ?? ""}
            onChange={(event) =>
              updateText("submitButtonText", event.target.value)
            }
            placeholder="Send"
          />
        </label>
        <label className="space-y-2 text-sm font-medium md:col-span-2" htmlFor="initial-message">
          Initial message
          <Textarea
            id="initial-message"
            value={config.initialMessage ?? ""}
            onChange={(event) =>
              updateText("initialMessage", event.target.value)
            }
            placeholder="Hello! 👋 How can I help you today?"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm" htmlFor="show-timestamps">
          <Checkbox
            id="show-timestamps"
            checked={config.showMessageTimestamps}
            onCheckedChange={(checked) =>
              update({ showMessageTimestamps: checked === true })
            }
          />
          Show message timestamps
        </label>
        <div className="space-y-1">
          <label
            className="flex items-center gap-2 text-sm text-muted-foreground"
            htmlFor="generate-starters"
          >
            <Checkbox
              id="generate-starters"
              checked={config.generateStarterQuestionsAfterResponse}
              disabled
            />
            Generate starter questions after a response
          </label>
          <p className="ml-6 text-xs text-muted-foreground">
            This option will be implemented soon.
          </p>
        </div>
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
            disabled={fields.length >= 3}
            onClick={() => append({ value: "" })}
            type="button"
            variant="outline"
          >
            Add question
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {fields.map((field, index) => (
            <div className="flex items-center gap-2" key={field.id}>
              <Input
                {...starterForm.register(`starterQuestions.${index}.value`)}
                placeholder={`Question ${index + 1}`}
              />
              <Button
                aria-label={`Remove starter question ${index + 1}`}
                onClick={() => remove(index)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs text-muted-foreground">
          Model, generation, and usage limit options will be implemented soon.
        </p>
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium" htmlFor="model">
            Model
            <Input
              id="model"
              disabled
              value={config.model ?? ""}
              placeholder="Default model"
            />
          </label>
          <label className="space-y-2 text-sm font-medium" htmlFor="temperature">
            Temperature
            <Input
              id="temperature"
              type="number"
              disabled
              min="0"
              max="2"
              step="0.1"
              value={config.temperature ?? ""}
              placeholder="Default"
            />
          </label>
          <label className="space-y-2 text-sm font-medium" htmlFor="max-tokens">
            Max tokens
            <Input
              id="max-tokens"
              type="number"
              disabled
              min="1"
              value={config.maxTokens ?? ""}
              placeholder="Unlimited"
            />
          </label>
          <label className="space-y-2 text-sm font-medium" htmlFor="daily-limit">
            Max messages per day
            <Input
              id="daily-limit"
              type="number"
              disabled
              min="1"
              value={config.maxMessagesPerDay ?? ""}
              placeholder="Unlimited"
            />
          </label>
          <label className="space-y-2 text-sm font-medium" htmlFor="conversation-limit">
            Max user messages per conversation
            <Input
              id="conversation-limit"
              type="number"
              disabled
              min="1"
              value={config.maxUserMessagesPerConversation ?? ""}
              placeholder="Unlimited"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        {(
          [
            ["chatBackgroundColor", "Chat background"],
            ["headerFooterBackgroundColor", "Header and footer background"],
            ["assistantMessageBackgroundColor", "Assistant message background"],
            ["userMessageBackgroundColor", "User message background"],
          ] as const
        ).map(([field, label]) => (
          <label className="space-y-2 text-sm font-medium" htmlFor={field} key={field}>
            {label}
            <Input
              id={field}
              value={config[field] ?? ""}
              onChange={(event) => updateText(field, event.target.value)}
              placeholder="#ffffff, rgb(...) or hsl(...)"
            />
          </label>
        ))}
      </div>
    </section>
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
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  orgSlug: string;
}) {
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
    <div className="w-full max-w-none space-y-6">
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

      <ChatConfigSection bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
    </div>
  );
}
