import { useFieldArray } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import { Field, FieldError } from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";

import type { StarterQuestionsFormValues } from "./form-utils";

export function StarterQuestionsSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
}: {
  form: UseFormReturn<StarterQuestionsFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: StarterQuestionsFormValues) => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "starterQuestions",
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">Starter questions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add up to three unique questions shown in the initial state.
            </p>
          </div>
          <Button
            disabled={isDisabled || fields.length >= 3}
            onClick={() => append({ value: "" })}
            type="button"
            variant="outline"
          >
            Add question
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div className="flex items-start gap-2" key={field.id}>
              <Field
                className="min-w-0 flex-1"
                data-invalid={Boolean(
                  form.formState.errors.starterQuestions?.[index]?.value,
                )}
              >
                <Input
                  {...form.register(`starterQuestions.${index}.value`)}
                  aria-label={`Starter question ${index + 1}`}
                  aria-invalid={Boolean(
                    form.formState.errors.starterQuestions?.[index]?.value,
                  )}
                  disabled={isDisabled}
                  placeholder={`Question ${index + 1}`}
                />
                {form.formState.errors.starterQuestions?.[index]?.value && (
                  <FieldError
                    errors={[
                      form.formState.errors.starterQuestions[index].value,
                    ]}
                  />
                )}
              </Field>
              <Button
                aria-label={`Remove starter question ${index + 1}`}
                disabled={isDisabled}
                onClick={() => remove(index)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                ×
              </Button>
            </div>
          ))}
          {form.formState.errors.starterQuestions?.message && (
            <FieldError errors={[form.formState.errors.starterQuestions]} />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={
              isDisabled || !form.formState.isDirty || !form.formState.isValid
            }
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
