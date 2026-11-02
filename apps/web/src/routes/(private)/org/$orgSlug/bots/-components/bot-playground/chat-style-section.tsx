import { Controller, useWatch } from "react-hook-form";
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
  CHAT_STYLE_DEFAULTS,
  DEFAULT_CHAT_COLORS,
  chatFontFamilyOptions,
  chatMessageFontSizeOptions,
  chatShadowOptions,
  floatingPositionOptions,
  launcherIconOptions,
  type ChatConfigFormValues,
} from "./form-utils";
import { getChatMessageContrastRatio } from "./-helpers/chat-message-contrast";

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

const themeColorFields = [
  "chatBackgroundColor",
  "headerFooterBackgroundColor",
  "footerBackgroundColor",
  "inputBackgroundColor",
  "inputTextColor",
  "starterQuestionsTextColor",
  "assistantMessageBackgroundColor",
  "userMessageBackgroundColor",
  "assistantMessageTextColor",
  "userMessageTextColor",
  "launcherBackgroundColor",
  "chatBorderColor",
] as const;

type ThemeColorField = (typeof themeColorFields)[number];
type ThemeName = "default" | "light" | "dark" | "brand";
type ThemeValues = Pick<
  ChatConfigFormValues,
  ThemeColorField | "chatBorderWidth"
>;

const themePresets: Record<ThemeName, { label: string; values: ThemeValues }> =
  {
    default: {
      label: "Default",
      values: {
        ...DEFAULT_CHAT_COLORS,
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "",
        chatBorderColor: "",
        chatBorderWidth: CHAT_STYLE_DEFAULTS.chatBorderWidth,
      },
    },
    light: {
      label: "Light",
      values: {
        chatBackgroundColor: "#ffffff",
        headerFooterBackgroundColor: "#f3f4f6",
        footerBackgroundColor: "",
        inputBackgroundColor: "#ffffff",
        inputTextColor: "",
        starterQuestionsTextColor: "",
        assistantMessageBackgroundColor: "#f9fafb",
        userMessageBackgroundColor: "#e5e7eb",
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "#0865cf",
        chatBorderColor: "#d1d5db",
        chatBorderWidth: 1,
      },
    },
    dark: {
      label: "Dark",
      values: {
        chatBackgroundColor: "#111827",
        headerFooterBackgroundColor: "#1f2937",
        footerBackgroundColor: "#1f2937",
        inputBackgroundColor: "#111827",
        inputTextColor: "#f9fafb",
        starterQuestionsTextColor: "#f9fafb",
        assistantMessageBackgroundColor: "#1f2937",
        userMessageBackgroundColor: "#2563eb",
        assistantMessageTextColor: "#f9fafb",
        userMessageTextColor: "#ffffff",
        launcherBackgroundColor: "#2563eb",
        chatBorderColor: "#374151",
        chatBorderWidth: 1,
      },
    },
    brand: {
      label: "Brand",
      values: {
        ...DEFAULT_CHAT_COLORS,
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "#0865cf",
        chatBorderColor: "#d1d5db",
        chatBorderWidth: 1,
      },
    },
  };

function getManualContrastWarning(
  textColor: string,
  messageBackgroundColor: string,
  chatBackgroundColor: string,
) {
  if (!textColor) return undefined;
  const ratio = getChatMessageContrastRatio(
    textColor,
    messageBackgroundColor,
    chatBackgroundColor,
  );
  return ratio !== null && ratio < 4.5
    ? `Contrast is ${ratio.toFixed(2)}:1, below 4.5:1.`
    : undefined;
}

function StyleSelect({
  control,
  disabled,
  label,
  name,
  options,
  optionLabels,
  hint,
}: {
  control: UseFormReturn<ChatConfigFormValues>["control"];
  disabled: boolean;
  label: string;
  name:
    | "chatShadow"
    | "floatingPosition"
    | "launcherIcon"
    | "chatFontFamily"
    | "chatMessageFontSize";
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

function StyleSlider({
  control,
  disabled,
  label,
  name,
  unit,
  limits,
  step = 1,
}: {
  control: UseFormReturn<ChatConfigFormValues>["control"];
  disabled: boolean;
  label: string;
  name:
    | "chatWidth"
    | "chatHeight"
    | "chatRadius"
    | "messageRadius"
    | "chatBorderWidth"
    | "launcherSize";
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
  const currentValues = useWatch({ control: form.control });
  const themeNames: readonly ThemeName[] = [
    "default",
    "light",
    "dark",
    "brand",
  ];
  const activeTheme = themeNames.find(
    (name) =>
      themeColorFields.every(
        (field) => currentValues[field] === themePresets[name].values[field],
      ) &&
      currentValues.chatBorderWidth ===
        themePresets[name].values.chatBorderWidth,
  );

  function applyTheme(name: ThemeName) {
    const values = themePresets[name].values;
    for (const field of themeColorFields) {
      form.setValue(field, values[field], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    form.setValue("chatBorderWidth", values.chatBorderWidth, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const assistantContrastBackground =
    currentValues.assistantMessageBackgroundColor ||
    DEFAULT_CHAT_COLORS.assistantMessageBackgroundColor;
  const userContrastBackground =
    currentValues.userMessageBackgroundColor ||
    DEFAULT_CHAT_COLORS.userMessageBackgroundColor;
  const chatContrastBackground =
    currentValues.chatBackgroundColor ||
    DEFAULT_CHAT_COLORS.chatBackgroundColor;

  return (
    <section className="mt-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="font-medium">Style</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust the chat layout, component colors, and floating button
          position.
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium">Theme presets</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Apply a color palette, then customize individual colors.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Current: {activeTheme ? themePresets[activeTheme].label : "Custom"}
          </span>
        </div>
        <div
          aria-label="Chat color theme"
          className="flex flex-wrap gap-2"
          role="group"
        >
          {themeNames.map((name) => (
            <Button
              aria-pressed={activeTheme === name}
              disabled={isSaving}
              key={name}
              onClick={() => applyTheme(name)}
              type="button"
              variant={activeTheme === name ? "default" : "outline"}
            >
              {themePresets[name].label}
            </Button>
          ))}
        </div>
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
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Chat border width"
          limits={CHAT_STYLE_LIMITS.chatBorderWidth}
          name="chatBorderWidth"
          unit="px"
        />
        <StyleSlider
          control={form.control}
          disabled={isSaving}
          label="Floating button size"
          limits={CHAT_STYLE_LIMITS.launcherSize}
          name="launcherSize"
          step={CHAT_STYLE_LIMITS.launcherSize.step}
          unit="px"
        />

        <StyleSelect
          control={form.control}
          disabled={isSaving}
          label="Chat shadow"
          name="chatShadow"
          options={chatShadowOptions}
          optionLabels={shadowLabels}
        />
        <StyleSelect
          control={form.control}
          disabled={isSaving}
          hint="This setting applies to the floating widget only."
          label="Floating button position"
          name="floatingPosition"
          options={floatingPositionOptions}
          optionLabels={positionLabels}
        />
        <StyleSelect
          control={form.control}
          disabled={isSaving}
          hint="The avatar option uses the image configured in the Avatar section."
          label="Floating button icon"
          name="launcherIcon"
          options={launcherIconOptions}
          optionLabels={launcherIconLabels}
        />
        <StyleSelect
          control={form.control}
          disabled={isSaving}
          label="Chat font family"
          name="chatFontFamily"
          options={chatFontFamilyOptions}
          optionLabels={fontFamilyLabels}
        />
        <StyleSelect
          control={form.control}
          disabled={isSaving}
          label="Message text size"
          name="chatMessageFontSize"
          options={chatMessageFontSizeOptions}
          optionLabels={messageFontSizeLabels}
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
              ["assistantMessageTextColor", "Assistant message text"],
              ["userMessageTextColor", "User message text"],
              [
                "assistantMessageBackgroundColor",
                "Assistant message background",
              ],
              ["userMessageBackgroundColor", "User message background"],
              ["launcherBackgroundColor", "Floating button background"],
              ["chatBorderColor", "Chat border"],
            ] as const
          ).map(([field, label]) => (
            <Controller
              control={form.control}
              key={field}
              name={field}
              render={({ field: inputField, fieldState }) => {
                const contrastBackground =
                  field === "assistantMessageTextColor"
                    ? assistantContrastBackground
                    : field === "userMessageTextColor"
                      ? userContrastBackground
                      : undefined;
                const contrastWarning = contrastBackground
                  ? getManualContrastWarning(
                      inputField.value,
                      contrastBackground,
                      chatContrastBackground,
                    )
                  : undefined;

                return (
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
                    {(field === "assistantMessageTextColor" ||
                      field === "userMessageTextColor") && (
                      <p className="text-xs text-muted-foreground">
                        Leave empty to choose a readable text color
                        automatically.
                      </p>
                    )}
                    {contrastWarning && (
                      <p
                        aria-live="polite"
                        className="text-xs text-amber-700 dark:text-amber-400"
                      >
                        {contrastWarning}
                      </p>
                    )}
                  </Field>
                );
              }}
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
