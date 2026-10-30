import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ButtonSpinner } from "@/components/button-spinner";
import { useEditBotMutation } from "@/hooks/use-bots";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
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

          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
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
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={informationMutation.isPending}
                    id={field.name}
                    maxLength={500}
                    placeholder="Briefly describe this bot's purpose."
                    rows={3}
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
                  <FieldLabel htmlFor={field.name}>System message</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    disabled={instructionsMutation.isPending}
                    id={field.name}
                    maxLength={10_000}
                    placeholder="Define the main instructions for the bot's behavior."
                    rows={8}
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
    </div>
  );
}
