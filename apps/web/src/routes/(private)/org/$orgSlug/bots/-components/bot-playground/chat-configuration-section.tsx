import { Controller, useFieldArray } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import { Field, FieldError } from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";

import {
  CHAT_CONFIG_TEXT_LIMITS,
  type ChatConfigFormValues,
} from "./form-utils";

export function ChatConfigurationSection({
  form,
  isSaving,
}: {
  form: UseFormReturn<ChatConfigFormValues>;
  isSaving: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "starterQuestions",
  });

  return (
    <section className="mt-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="font-medium">Chat configuration</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes are saved when you click Save changes.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="header-status"
        >
          Header status
          <Input
            {...form.register("headerStatusText")}
            disabled={isSaving}
            id="header-status"
            maxLength={CHAT_CONFIG_TEXT_LIMITS.headerStatusText}
            placeholder="We are online"
          />
        </label>
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="input-placeholder"
        >
          Input placeholder
          <Input
            {...form.register("inputPlaceholder")}
            disabled={isSaving}
            id="input-placeholder"
            maxLength={CHAT_CONFIG_TEXT_LIMITS.inputPlaceholder}
            placeholder="Type your message..."
          />
        </label>
        <label className="space-y-2 text-sm font-medium" htmlFor="submit-text">
          Submit button text
          <Input
            {...form.register("submitButtonText")}
            disabled={isSaving}
            id="submit-text"
            maxLength={CHAT_CONFIG_TEXT_LIMITS.submitButtonText}
            placeholder="Send"
          />
        </label>
        <label
          className="space-y-2 text-sm font-medium md:col-span-2"
          htmlFor="initial-message"
        >
          Initial message
          <Textarea
            {...form.register("initialMessage")}
            disabled={isSaving}
            id="initial-message"
            maxLength={CHAT_CONFIG_TEXT_LIMITS.initialMessage}
            placeholder="Hello! 👋 How can I help you today?"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Controller
          control={form.control}
          name="showMessageTimestamps"
          render={({ field }) => (
            <label
              className="flex items-center gap-2 text-sm"
              htmlFor="show-timestamps"
            >
              <Checkbox
                checked={field.value}
                disabled={isSaving}
                id="show-timestamps"
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              Show message timestamps
            </label>
          )}
        />
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
            disabled={isSaving || fields.length >= 3}
            onClick={() => append({ value: "" })}
            type="button"
            variant="outline"
          >
            Add question
          </Button>
        </div>
        <div className="mt-3 space-y-3">
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
                  disabled={isSaving}
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
                disabled={isSaving}
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
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          disabled={
            isSaving || !form.formState.isDirty || !form.formState.isValid
          }
          type="submit"
        >
          {isSaving ? "Saving..." : "Save changes"}
          {isSaving && <ButtonSpinner />}
        </Button>
      </div>
    </section>
  );
}
