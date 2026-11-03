import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import {
  DEFAULT_CHAT_MODEL_ID,
  getChatModelDefinition,
} from "@training-ia/contracts";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";
import { Slider } from "@training-ia/ui/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";

import {
  chatModelDefinitions,
  MAX_CHAT_MESSAGE_LIMIT,
  type AiConfigurationFormValues,
} from "./form-utils";

type AiConfigurationSectionProps = {
  form: UseFormReturn<AiConfigurationFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: AiConfigurationFormValues) => void;
  primaryModelDefinition: NonNullable<
    ReturnType<typeof getChatModelDefinition>
  >;
  suggestionsModel: ReturnType<typeof getChatModelDefinition>;
};

export function AiConfigurationSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
  primaryModelDefinition,
  suggestionsModel,
}: AiConfigurationSectionProps) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">AI configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the model and generation parameters used by this bot.
            Changes are saved when you click Save changes.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <Controller
            control={form.control}
            name="model"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                <Select
                  disabled={isDisabled}
                  onValueChange={(value) => {
                    if (value === DEFAULT_CHAT_MODEL_ID) {
                      field.onChange(null);
                      return;
                    }

                    const model = getChatModelDefinition(value);
                    if (model?.purpose === "chat") {
                      field.onChange(value);
                    }
                  }}
                  value={field.value ?? DEFAULT_CHAT_MODEL_ID}
                >
                  <SelectTrigger
                    aria-invalid={fieldState.invalid}
                    id={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatModelDefinitions.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                        {model.id === DEFAULT_CHAT_MODEL_ID && " (default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The default option is stored as null in the configuration.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="temperature"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor={field.name}>Temperature</FieldLabel>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {field.value === null
                      ? "Model default"
                      : field.value.toFixed(1)}
                  </span>
                </div>
                <Slider
                  aria-invalid={fieldState.invalid}
                  aria-label="Temperature"
                  disabled={
                    isDisabled || !primaryModelDefinition.supportsTemperature
                  }
                  id={field.name}
                  max={2}
                  min={0}
                  onBlur={field.onBlur}
                  onValueChange={([value]) => {
                    if (value !== undefined) field.onChange(value);
                  }}
                  ref={field.ref}
                  step={0.1}
                  value={[field.value ?? 1]}
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Optional. Drag to choose a value from 0 to 2.
                  </p>
                  {field.value !== null && (
                    <Button
                      className="-mt-1"
                      disabled={isDisabled}
                      onClick={() => field.onChange(null)}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      Use model default
                    </Button>
                  )}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="maxTokens"
            render={({ field, fieldState }) => {
              const maxTokensLimit = Math.min(
                primaryModelDefinition.maxTokens ?? 200_000,
                200_000,
              );

              return (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>Max tokens</FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Model default"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max tokens"
                    disabled={
                      isDisabled || !primaryModelDefinition.supportsMaxTokens
                    }
                    id={field.name}
                    max={maxTokensLimit}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={maxTokensLimit >= 1_000 ? 100 : 1}
                    value={[field.value ?? Math.min(maxTokensLimit, 1_000)]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to choose up to{" "}
                      {maxTokensLimit.toLocaleString()} tokens.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isDisabled}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Use model default
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />

          <Controller
            control={form.control}
            name="generateStarterQuestionsAfterResponse"
            render={({ field }) => (
              <div className="space-y-1 md:col-span-2">
                <label
                  className="flex items-center gap-2 text-sm"
                  htmlFor="generate-starters"
                >
                  <Checkbox
                    aria-label="Generate starter questions after a response"
                    checked={field.value}
                    disabled={isDisabled}
                    id="generate-starters"
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Generate starter questions after a response
                </label>
                <p className="ml-6 text-xs text-muted-foreground">
                  Suggestions use the {suggestionsModel?.label ?? "configured"}{" "}
                  model and remain controlled by the backend.
                </p>
              </div>
            )}
          />
        </div>

        <div className="mt-6">
          <h4 className="mb-1 text-sm font-medium">Usage limits</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Leave a field empty to allow unlimited messages. Values are saved
            when you click Save changes.
          </p>
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <Controller
              control={form.control}
              name="maxMessagesPerDay"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>
                      Max messages per day
                    </FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Unlimited"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max messages per day"
                    disabled={isDisabled}
                    id={field.name}
                    max={MAX_CHAT_MESSAGE_LIMIT}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={1}
                    value={[field.value ?? 100]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to set a daily limit up to{" "}
                      {MAX_CHAT_MESSAGE_LIMIT.toLocaleString()}.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isDisabled}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Unlimited
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="maxUserMessagesPerConversation"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>
                      Max user messages per conversation
                    </FieldLabel>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {field.value === null
                        ? "Unlimited"
                        : field.value.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    aria-invalid={fieldState.invalid}
                    aria-label="Max user messages per conversation"
                    disabled={isDisabled}
                    id={field.name}
                    max={MAX_CHAT_MESSAGE_LIMIT}
                    min={1}
                    onBlur={field.onBlur}
                    onValueChange={([value]) => {
                      if (value !== undefined) field.onChange(value);
                    }}
                    ref={field.ref}
                    step={1}
                    value={[field.value ?? 10]}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Optional. Drag to set a conversation limit up to{" "}
                      {MAX_CHAT_MESSAGE_LIMIT.toLocaleString()}.
                    </p>
                    {field.value !== null && (
                      <Button
                        className="-mt-1"
                        disabled={isDisabled}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        Unlimited
                      </Button>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
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
