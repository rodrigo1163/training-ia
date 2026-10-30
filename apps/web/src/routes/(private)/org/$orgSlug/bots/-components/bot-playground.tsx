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

const botPlaygroundSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name must be at most 80 characters." }),
  description: z
    .string()
    .trim()
    .max(500, { error: "Description must be at most 500 characters." }),
  personality: z.enum(botPersonalities),
  language: z
    .string()
    .trim()
    .min(2, { error: "O idioma deve ter pelo menos 2 caracteres." })
    .max(20, { error: "Language must be at most 20 characters." }),
  systemMessage: z.string().trim().max(10_000, {
    error: "System message must be at most 10,000 characters.",
  }),
});

type FormValues = z.infer<typeof botPlaygroundSchema>;

function getInitialValues(bot: Bot): FormValues {
  return {
    name: bot.name,
    description: bot.description ?? "",
    personality: bot.personality,
    language: bot.language,
    systemMessage: bot.systemMessage ?? "",
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
  const form = useForm<FormValues>({
    defaultValues: getInitialValues(bot),
    resolver: zodResolver(botPlaygroundSchema),
  });

  useEffect(() => {
    form.reset(getInitialValues(bot));
  }, [bot, form]);

  const mutation = useEditBotMutation(orgSlug, botSlug);

  function onSubmit(values: FormValues) {
    mutation.mutate(
      {
        name: values.name,
        description: values.description || null,
        personality: values.personality,
        language: values.language,
        systemMessage: values.systemMessage || null,
      },
      {
        onError: (error) =>
          toast.add({ title: error.message, type: "error" }),
        onSuccess: () =>
          toast.add({ title: "Bot updated successfully.", type: "success" }),
      },
    );
  }

  return (
    <div className="w-full max-w-none">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="rounded-lg border bg-card p-6">
          <section>
            <div>
              <div>
                <h3 className="font-medium">Bot information</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage the name and description used to identify this bot.
                </p>
              </div>
            </div>

            <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
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
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
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
          </section>

          <section className="mt-8 border-t pt-8">
            <div>
              <h3 className="font-medium">Comportamento</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Define how the bot should communicate and which language to use.
              </p>
            </div>

            <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
              <Controller
                control={form.control}
                name="personality"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Personalidade</FieldLabel>
                    <Select
                      disabled={mutation.isPending}
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
                control={form.control}
                name="language"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Idioma</FieldLabel>
                    <Select
                      disabled={mutation.isPending}
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
          </section>

          <section className="mt-8 border-t pt-8">
            <div>
              <h3 className="font-medium">Bot instructions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the main instructions used by the bot when generating
                responses.
              </p>
            </div>

            <div className="mt-6 min-w-0">
              <Controller
                control={form.control}
                name="systemMessage"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>System message</FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
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
          </section>

          <div className="mt-6 flex justify-end border-t pt-6">
            <Button
              disabled={mutation.isPending || !form.formState.isDirty}
              type="submit"
            >
              {mutation.isPending ? "Saving..." : "Save changes"}
              {mutation.isPending && <ButtonSpinner />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
