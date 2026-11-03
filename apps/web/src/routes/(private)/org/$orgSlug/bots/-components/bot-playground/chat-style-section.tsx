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

import {
  DEFAULT_CHAT_COLORS,
  DEFAULT_DARK_CHAT_COLORS,
  type ChatStyleFormValues,
} from "./form-utils";
import type { ChatTheme } from "@/api/bots/types";
import { getChatMessageContrastRatio } from "./-helpers/chat-message-contrast";

const paletteColorFields = [
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

type PaletteColorField = (typeof paletteColorFields)[number];
type PalettePresetName = "default" | "daylight" | "midnight" | "brand";
type PalettePresetValues = Pick<
  ChatStyleFormValues["style"]["colors"]["light"],
  PaletteColorField
>;
type PaletteColorPath = `style.colors.${ChatTheme}.${PaletteColorField}`;

type PalettePreset = {
  name: PalettePresetName;
  label: string;
  values: PalettePresetValues;
};

const palettePresets: Record<ChatTheme, readonly PalettePreset[]> = {
  light: [
    {
      name: "default",
      label: "Default",
      values: {
        ...DEFAULT_CHAT_COLORS,
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "",
        chatBorderColor: "#e3eaf3",
      },
    },
    {
      name: "daylight",
      label: "Daylight",
      values: {
        chatBackgroundColor: "#ffffff",
        headerFooterBackgroundColor: "#f3f4f6",
        footerBackgroundColor: "",
        inputBackgroundColor: "#ffffff",
        inputTextColor: "#111827",
        starterQuestionsTextColor: "",
        assistantMessageBackgroundColor: "#f9fafb",
        userMessageBackgroundColor: "#e5e7eb",
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "#0865cf",
        chatBorderColor: "#e3eaf3",
      },
    },
    {
      name: "brand",
      label: "Brand",
      values: {
        ...DEFAULT_CHAT_COLORS,
        assistantMessageTextColor: "",
        userMessageTextColor: "",
        launcherBackgroundColor: "#0865cf",
        chatBorderColor: "#e3eaf3",
      },
    },
  ],
  dark: [
    {
      name: "default",
      label: "Default",
      values: {
        ...DEFAULT_DARK_CHAT_COLORS,
      },
    },
    {
      name: "midnight",
      label: "Midnight",
      values: {
        chatBackgroundColor: "#030712",
        headerFooterBackgroundColor: "#111827",
        footerBackgroundColor: "#111827",
        inputBackgroundColor: "#030712",
        inputTextColor: "#f9fafb",
        starterQuestionsTextColor: "#f9fafb",
        assistantMessageBackgroundColor: "#111827",
        userMessageBackgroundColor: "#1d4ed8",
        assistantMessageTextColor: "#f9fafb",
        userMessageTextColor: "#ffffff",
        launcherBackgroundColor: "#1d4ed8",
        chatBorderColor: "#374151",
      },
    },
    {
      name: "brand",
      label: "Brand",
      values: {
        ...DEFAULT_DARK_CHAT_COLORS,
        headerFooterBackgroundColor: "#0865cf",
        userMessageBackgroundColor: "#0865cf",
        launcherBackgroundColor: "#0865cf",
      },
    },
  ],
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

export function ChatStyleSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
  onPaletteThemeChange,
  paletteTheme,
}: {
  form: UseFormReturn<ChatStyleFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: ChatStyleFormValues) => void;
  onPaletteThemeChange: (theme: ChatTheme) => void;
  paletteTheme: ChatTheme;
}) {
  const currentValues = useWatch({ control: form.control });
  const currentColors = currentValues.style?.colors?.[paletteTheme];
  const paletteDefaults =
    paletteTheme === "light" ? DEFAULT_CHAT_COLORS : DEFAULT_DARK_CHAT_COLORS;
  const themePalettePresets = palettePresets[paletteTheme];
  const activePreset = themePalettePresets.find((preset) =>
    paletteColorFields.every(
      (field) => currentColors?.[field] === preset.values[field],
    ),
  );

  function applyPalettePreset(preset: PalettePreset) {
    for (const field of paletteColorFields) {
      form.setValue(
        `style.colors.${paletteTheme}.${field}` as PaletteColorPath,
        preset.values[field],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  }

  const assistantContrastBackground =
    currentColors?.assistantMessageBackgroundColor ||
    paletteDefaults.assistantMessageBackgroundColor;
  const userContrastBackground =
    currentColors?.userMessageBackgroundColor ||
    paletteDefaults.userMessageBackgroundColor;
  const chatContrastBackground =
    currentColors?.chatBackgroundColor || paletteDefaults.chatBackgroundColor;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Colors</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize chat component colors for light and dark themes.
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-medium">Component colors</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Editing and previewing:
              </span>
              {(["light", "dark"] as const).map((theme) => (
                <Button
                  aria-pressed={paletteTheme === theme}
                  disabled={isDisabled}
                  key={theme}
                  onClick={() => onPaletteThemeChange(theme)}
                  size="sm"
                  type="button"
                  variant={paletteTheme === theme ? "default" : "outline"}
                >
                  {theme === "light" ? "Light" : "Dark"}
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium">Palette presets</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Presets follow the selected editing and preview theme.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Current: {activePreset?.label ?? "Custom"}
              </span>
            </div>
            <div
              aria-label={
                paletteTheme === "light"
                  ? "Light palette presets"
                  : "Dark palette presets"
              }
              className="flex flex-wrap gap-2"
              role="group"
            >
              {themePalettePresets.map((preset) => (
                <Button
                  aria-pressed={activePreset?.name === preset.name}
                  disabled={isDisabled}
                  key={preset.name}
                  onClick={() => applyPalettePreset(preset)}
                  type="button"
                  variant={
                    activePreset?.name === preset.name ? "default" : "outline"
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
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
                ["chatBorderColor", "Chat border color"],
              ] as const
            ).map(([field, label]) => (
              <Controller
                control={form.control}
                key={field}
                name={
                  `style.colors.${paletteTheme}.${field}` as PaletteColorPath
                }
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
                        disabled={isDisabled}
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
                      {field === "chatBorderColor" && (
                        <p className="text-xs text-muted-foreground">
                          Used for the chat frame, message bubbles, suggestions,
                          and input border.
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
