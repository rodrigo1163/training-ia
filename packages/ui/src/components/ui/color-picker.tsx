import * as React from "react";
import {
  HexAlphaColorPicker,
  HexColorInput,
  HexColorPicker,
  HslStringColorPicker,
  HslaStringColorPicker,
  RgbStringColorPicker,
  RgbaStringColorPicker,
} from "react-colorful";

import { cn } from "../../lib/utils";

type ColorPickerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "color" | "onChange" | "onChangeCapture"
> & {
  color: string;
  onChange: (color: string) => void;
  onChangeEnd?: (color: string) => void;
  alpha?: boolean;
  disabled?: boolean;
  inputAriaLabel?: string;
  inputAriaInvalid?: React.InputHTMLAttributes<HTMLInputElement>["aria-invalid"];
  inputClassName?: string;
  inputId?: string;
  inputOnBlur?: React.FocusEventHandler<HTMLInputElement>;
  inputPlaceholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  pickerClassName?: string;
};

const colorInputClassName =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

type ColorFormat = "hex" | "rgb" | "hsl" | "custom";

function getColorFormat(color: string, alpha: boolean): ColorFormat {
  const normalizedColor = color.trim().toLowerCase();

  if (
    new RegExp(
      alpha
        ? "^#(?:[0-9a-f]{4}|[0-9a-f]{8})$"
        : "^#(?:[0-9a-f]{3}|[0-9a-f]{6})$",
    ).test(normalizedColor)
  ) {
    return "hex";
  }

  if (normalizedColor.startsWith(alpha ? "rgba(" : "rgb(")) {
    return "rgb";
  }

  if (normalizedColor.startsWith(alpha ? "hsla(" : "hsl(")) {
    return "hsl";
  }

  return color ? "custom" : "hex";
}

function ColorPicker({
  alpha = false,
  color,
  disabled = false,
  inputAriaLabel = "Hex color",
  inputAriaInvalid,
  inputClassName,
  inputId,
  inputOnBlur,
  inputPlaceholder,
  inputRef,
  onChange,
  onChangeEnd,
  pickerClassName,
  ...props
}: ColorPickerProps) {
  const colorFormat = getColorFormat(color, alpha);
  const pickerColor = color || (alpha ? "#00000000" : "#000000");
  const Picker =
    colorFormat === "rgb"
      ? alpha
        ? RgbaStringColorPicker
        : RgbStringColorPicker
      : colorFormat === "hsl"
        ? alpha
          ? HslaStringColorPicker
          : HslStringColorPicker
        : alpha
          ? HexAlphaColorPicker
          : HexColorPicker;

  return (
    <div
      data-disabled={disabled ? "" : undefined}
      data-slot="color-picker"
      {...props}
      aria-disabled={disabled || undefined}
      className={cn("flex w-full max-w-xs flex-col gap-3", props.className)}
    >
      {colorFormat !== "custom" && (
        <Picker
          aria-label="Color picker"
          className={cn(
            "h-48 w-full max-w-full",
            disabled && "pointer-events-none opacity-50",
            pickerClassName,
          )}
          color={pickerColor}
          onChange={onChange}
          onChangeEnd={onChangeEnd}
        />
      )}

      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-9 shrink-0 rounded-md border border-input bg-muted shadow-xs"
          style={color ? { backgroundColor: color } : undefined}
        />
        {colorFormat === "hex" ? (
          <HexColorInput
            alpha={alpha}
            aria-invalid={inputAriaInvalid}
            aria-label={inputAriaLabel}
            className={cn(colorInputClassName, inputClassName)}
            color={color}
            disabled={disabled}
            id={inputId}
            onBlur={inputOnBlur}
            onChange={onChange}
            placeholder={inputPlaceholder ?? (alpha ? "#00000000" : "#000000")}
            prefixed
          />
        ) : (
          <input
            aria-invalid={inputAriaInvalid}
            aria-label={inputAriaLabel}
            className={cn(colorInputClassName, inputClassName)}
            disabled={disabled}
            id={inputId}
            onBlur={inputOnBlur}
            onChange={(event) => onChange(event.target.value)}
            placeholder={inputPlaceholder ?? "#000000, rgb(...) or hsl(...)"}
            ref={inputRef}
            value={color}
          />
        )}
      </div>
    </div>
  );
}

export { ColorPicker };
export type { ColorPickerProps };
