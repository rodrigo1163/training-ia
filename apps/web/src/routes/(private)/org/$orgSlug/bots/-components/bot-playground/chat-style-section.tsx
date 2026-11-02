import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import { ColorPicker } from "@training-ia/ui/components/ui/color-picker";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Slider } from "@training-ia/ui/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";

import {
  CHAT_STYLE_LIMITS,
  chatShadowOptions,
  floatingPositionOptions,
  type ChatConfigFormValues,
} from "./form-utils";

const shadowLabels: Record<(typeof chatShadowOptions)[number], string> = {
  none: "None",
  sm: "Small",
  md: "Medium",
  lg: "Large",
  "2xl": "Extra large",
};

const positionLabels: Record<(typeof floatingPositionOptions)[number], string> =
  {
    "bottom-right": "Bottom right",
    "bottom-left": "Bottom left",
  };

function StyleSlider({
  control,
  disabled,
  label,
  name,
  unit,
  limits,
}: {
  control: UseFormReturn<ChatConfigFormValues>["control"];
  disabled: boolean;
  label: string;
  name: "chatWidth" | "chatHeight" | "chatRadius" | "messageRadius";
  unit: string;
  limits: { min: number; max: number };
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {field.value} {unit}
            </span>
          </div>
          <Slider
            aria-label={label}
            aria-valuetext={`${field.value} ${unit}`}
            disabled={disabled}
            id={field.name}
            max={limits.max}
            min={limits.min}
            onBlur={field.onBlur}
            onValueChange={([value]) => {
              if (value !== undefined) field.onChange(value);
            }}
            ref={field.ref}
            step={1}
            value={[field.value]}
          />
          <p className="text-xs text-muted-foreground">
            From {limits.min} to {limits.max} {unit}.
          </p>
        </Field>
      )}
    />
  );
}

export function ChatStyleSection({
  form,
  isSaving,
}: {
  form: UseFormReturn<ChatConfigFormValues>;
  isSaving: boolean;
}) {
  return (
    <section className="mt-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="font-medium">Style</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust the chat layout, component colors, and floating button
          position.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Chat width"
          limits={CHAT_STYLE_LIMITS.chatWidth}
          name="chatWidth"
          unit="px"
        />
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Chat height"
          limits={CHAT_STYLE_LIMITS.chatHeight}
          name="chatHeight"
          unit="px"
        />
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Chat corner radius"
          limits={CHAT_STYLE_LIMITS.chatRadius}
          name="chatRadius"
          unit="px"
        />
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Message corner radius"
          limits={CHAT_STYLE_LIMITS.messageRadius}
          name="messageRadius"
          unit="px"
        />

        <Controller
          control={form.control}
          name="chatShadow"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Chat shadow</FieldLabel>
              <Select
                disabled={isSaving}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  id={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue placeholder="Select a shadow" />
                </SelectTrigger>
                <SelectContent>
                  {chatShadowOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {shadowLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="floatingPosition"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Floating button position
              </FieldLabel>
              <Select
                disabled={isSaving}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  id={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {floatingPositionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {positionLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This setting applies to the floating widget only.
              </p>
            </Field>
          )}
        />
      </div>

      <div className="mt-6">
        <h4 className="mb-4 text-sm font-medium">Component colors</h4>
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          {(
            [
              ["chatBackgroundColor", "Chat background"],
              ["headerFooterBackgroundColor", "Header background"],
              ["footerBackgroundColor", "Footer background"],
              ["inputBackgroundColor", "Input background"],
              ["inputTextColor", "Input text"],
              ["starterQuestionsTextColor", "Suggestions text"],
              [
                "assistantMessageBackgroundColor",
                "Assistant message background",
              ],
              ["userMessageBackgroundColor", "User message background"],
            ] as const
          ).map(([field, label]) => (
            <Controller
              control={form.control}
              key={field}
              name={field}
              render={({ field: inputField, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={inputField.name}>{label}</FieldLabel>
                  <ColorPicker
                    alpha
                    aria-invalid={fieldState.invalid}
                    color={inputField.value}
                    disabled={isSaving}
                    inputAriaInvalid={fieldState.invalid}
                    inputAriaLabel={label}
                    inputId={inputField.name}
                    inputOnBlur={inputField.onBlur}
                    inputRef={inputField.ref}
                    onChange={inputField.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  {field === "starterQuestionsTextColor" && (
                    <p className="text-xs text-muted-foreground">
                      Suggestions keep a transparent background.
                    </p>
                  )}
                  {field === "footerBackgroundColor" && (
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use the header background color.
                    </p>
                  )}
                </Field>
              )}
            />
          ))}
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
