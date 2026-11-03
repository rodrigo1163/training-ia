import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
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
  chatFontFamilyOptions,
  chatMessageFontSizeOptions,
  chatShadowOptions,
  floatingPositionOptions,
  launcherIconOptions,
  type ChatLayoutFormValues,
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

const launcherIconLabels: Record<(typeof launcherIconOptions)[number], string> =
  {
    chat: "Chat bubble",
    bot: "Robot",
    sparkles: "Sparkles",
    avatar: "Bot avatar",
  };

const fontFamilyLabels: Record<(typeof chatFontFamilyOptions)[number], string> =
  {
    sans: "Sans serif",
    serif: "Serif",
    mono: "Monospace",
  };

const messageFontSizeLabels: Record<
  (typeof chatMessageFontSizeOptions)[number],
  string
> = {
  sm: "Small (13 px)",
  md: "Medium (14 px)",
  lg: "Large (16 px)",
};

function LayoutSelect({
  control,
  disabled,
  label,
  name,
  options,
  optionLabels,
  hint,
}: {
  control: UseFormReturn<ChatLayoutFormValues>["control"];
  disabled: boolean;
  label: string;
  name:
    | "style.chatShadow"
    | "style.floatingPosition"
    | "style.launcherIcon"
    | "style.chatFontFamily"
    | "style.chatMessageFontSize";
  options: readonly string[];
  optionLabels: Record<string, string>;
  hint?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select
            disabled={disabled}
            onValueChange={field.onChange}
            value={field.value}
          >
            <SelectTrigger
              aria-invalid={fieldState.invalid}
              id={field.name}
              onBlur={field.onBlur}
              ref={field.ref}
            >
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {optionLabels[option] ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function LayoutSlider({
  control,
  disabled,
  label,
  name,
  unit,
  limits,
  step = 1,
}: {
  control: UseFormReturn<ChatLayoutFormValues>["control"];
  disabled: boolean;
  label: string;
  name:
    | "style.chatWidth"
    | "style.chatHeight"
    | "style.chatRadius"
    | "style.messageRadius"
    | "style.chatBorderWidth"
    | "style.launcherSize";
  unit: string;
  limits: { min: number; max: number };
  step?: number;
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
            step={step}
            value={[field.value]}
          />
          <p className="text-xs text-muted-foreground">
            From {limits.min} to {limits.max} {unit}.
          </p>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function ChatLayoutSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
}: {
  form: UseFormReturn<ChatLayoutFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: ChatLayoutFormValues) => void;
}) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Chat layout and typography</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust chat dimensions, shape, typography, and floating button
            behavior.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Chat width"
            limits={CHAT_STYLE_LIMITS.chatWidth}
            name="style.chatWidth"
            unit="px"
          />
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Chat height"
            limits={CHAT_STYLE_LIMITS.chatHeight}
            name="style.chatHeight"
            unit="px"
          />
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Chat corner radius"
            limits={CHAT_STYLE_LIMITS.chatRadius}
            name="style.chatRadius"
            unit="px"
          />
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Message corner radius"
            limits={CHAT_STYLE_LIMITS.messageRadius}
            name="style.messageRadius"
            unit="px"
          />
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Chat border width"
            limits={CHAT_STYLE_LIMITS.chatBorderWidth}
            name="style.chatBorderWidth"
            unit="px"
          />
          <LayoutSlider
            control={form.control}
            disabled={isDisabled}
            label="Floating button size"
            limits={CHAT_STYLE_LIMITS.launcherSize}
            name="style.launcherSize"
            step={CHAT_STYLE_LIMITS.launcherSize.step}
            unit="px"
          />
          <LayoutSelect
            control={form.control}
            disabled={isDisabled}
            label="Chat shadow"
            name="style.chatShadow"
            options={chatShadowOptions}
            optionLabels={shadowLabels}
          />
          <LayoutSelect
            control={form.control}
            disabled={isDisabled}
            hint="This setting applies to the floating widget only."
            label="Floating button position"
            name="style.floatingPosition"
            options={floatingPositionOptions}
            optionLabels={positionLabels}
          />
          <LayoutSelect
            control={form.control}
            disabled={isDisabled}
            hint="The avatar option uses the image configured in the Avatar section."
            label="Floating button icon"
            name="style.launcherIcon"
            options={launcherIconOptions}
            optionLabels={launcherIconLabels}
          />
          <LayoutSelect
            control={form.control}
            disabled={isDisabled}
            label="Chat font family"
            name="style.chatFontFamily"
            options={chatFontFamilyOptions}
            optionLabels={fontFamilyLabels}
          />
          <LayoutSelect
            control={form.control}
            disabled={isDisabled}
            label="Message text size"
            name="style.chatMessageFontSize"
            options={chatMessageFontSizeOptions}
            optionLabels={messageFontSizeLabels}
          />
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
