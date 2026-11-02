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

import type { InstructionsFormValues } from "./form-utils";

type BotInstructionsSectionProps = {
  form: UseFormReturn<InstructionsFormValues>;
  isSaving: boolean;
  onSubmit: (values: InstructionsFormValues) => void;
};

export function BotInstructionsSection({
  form,
  isSaving,
  onSubmit,
}: BotInstructionsSectionProps) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
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
            control={form.control}
            name="systemMessage"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>System message</FieldLabel>
                <DocumentTextEditor
                  ariaLabel="Bot system message"
                  className="mb-0 h-80"
                  hasEmptyTextError={false}
                  isSaving={isSaving}
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
          <Button disabled={isSaving || !form.formState.isDirty} type="submit">
            {isSaving ? "Saving..." : "Save changes"}
            {isSaving && <ButtonSpinner />}
          </Button>
        </div>
      </section>
    </form>
  );
}
