import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { botLanguages, botPersonalities } from "@/api/bots/types";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";

import { personalityLabels, type BehaviorFormValues } from "./form-utils";

type BotBehaviorSectionProps = {
  form: UseFormReturn<BehaviorFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: BehaviorFormValues) => void;
};

export function BotBehaviorSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
}: BotBehaviorSectionProps) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="rounded-lg border bg-card p-6">
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
                  disabled={isDisabled}
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
                  disabled={isDisabled}
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
            disabled={isDisabled || !form.formState.isDirty}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save changes"}
            {isSaving && <ButtonSpinner />}
          </Button>
        </div>
      </section>
    </form>
  );
}
