import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { DocumentTextEditor } from "../document-text-editor";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";

import type { InformationFormValues } from "./form-utils";

type BotInformationSectionProps = {
  form: UseFormReturn<InformationFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: InformationFormValues) => void;
};

export function BotInformationSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
}: BotInformationSectionProps) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Bot information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the name and description used to identify this bot.
          </p>
        </div>

        <div className="mt-6 flex min-w-0 flex-col gap-5">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={isDisabled}
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
                <FieldLabel>Description</FieldLabel>
                <DocumentTextEditor
                  ariaLabel="Bot description"
                  className="mb-0 h-64"
                  hasEmptyTextError={false}
                  isSaving={isDisabled}
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
