import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  botLanguages,
  botPersonalities,
  botQueryKey,
  botsQueryKey,
  editBot,
  type Bot,
  type BotPersonality,
  type EditBotInput,
} from "@/components/bots/bots";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import { Separator } from "@training-ia/ui/components/ui/separator";
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
  EMPATHETIC: "Empática",
  FRIENDLY: "Amigável",
  NEUTRAL: "Neutra",
  PLAYFUL: "Descontraída",
  PROFESSIONAL: "Profissional",
  TECHNICAL: "Técnica",
};

const botPlaygroundSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "O nome deve ter pelo menos 2 caracteres." })
    .max(80, { error: "O nome deve ter no máximo 80 caracteres." }),
  description: z
    .string()
    .trim()
    .max(500, { error: "A descrição deve ter no máximo 500 caracteres." }),
  personality: z.enum(botPersonalities),
  language: z
    .string()
    .trim()
    .min(2, { error: "O idioma deve ter pelo menos 2 caracteres." })
    .max(20, { error: "O idioma deve ter no máximo 20 caracteres." }),
  systemMessage: z.string().trim().max(10_000, {
    error: "A mensagem do sistema deve ter no máximo 10.000 caracteres.",
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
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    defaultValues: getInitialValues(bot),
    resolver: zodResolver(botPlaygroundSchema),
  });

  useEffect(() => {
    form.reset(getInitialValues(bot));
  }, [bot, form]);

  const mutation = useMutation({
    mutationFn: (input: EditBotInput) => editBot(orgSlug, botSlug, input),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async (updatedBot) => {
      queryClient.setQueryData(botQueryKey(orgSlug, botSlug), updatedBot);
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
      toast.add({ title: "Bot atualizado com sucesso.", type: "success" });
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate({
      name: values.name,
      description: values.description || null,
      personality: values.personality,
      language: values.language,
      systemMessage: values.systemMessage || null,
    });
  }

  return (
    <div className="w-full max-w-none">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <section className="grid gap-6 pb-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            <div>
              <h3 className="font-medium">Informações do bot</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Gerencie o nome e a descrição usados para identificar este bot.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                      id={field.name}
                      placeholder="Ex.: Atendimento"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                      id={field.name}
                      maxLength={500}
                      placeholder="Descreva brevemente a finalidade deste bot."
                      rows={3}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="grid gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            <div>
              <h3 className="font-medium">Comportamento</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina como o bot deve se comunicar e em qual idioma responder.
              </p>
            </div>

            <div className="grid min-w-0 gap-5 md:grid-cols-2">
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
                        <SelectValue placeholder="Selecione uma personalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {botPersonalities.map((personality) => (
                          <SelectItem key={personality} value={personality}>
                            {personalityLabels[personality]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
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
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {botLanguages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="grid gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            <div>
              <h3 className="font-medium">Instruções do bot</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste as instruções principais usadas pelo bot ao gerar respostas.
              </p>
            </div>

            <div className="min-w-0">
              <Controller
                control={form.control}
                name="systemMessage"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Mensagem do sistema
                    </FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                      id={field.name}
                      maxLength={10_000}
                      placeholder="Defina as instruções principais para o comportamento do bot."
                      rows={8}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            <div className="flex justify-end md:col-start-2">
              <Button
                disabled={mutation.isPending || !form.formState.isDirty}
                type="submit"
              >
                {mutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
