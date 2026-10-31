const cssColorPattern =
  /^(?:#[\da-f]{3,4}|#[\da-f]{6}(?:[\da-f]{2})?|rgba?\(\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)\s*,\s*(?:\d{1,3}%?)(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\)|hsla?\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%(?:\s*,\s*(?:\d*\.\d+|\d+(?:\.\d+)?%?))?\s*\))$/i;

type RgbColor = { red: number; green: number; blue: number; alpha: number };

export function isSafeCssColor(value: string): boolean {
  return cssColorPattern.test(value.trim());
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function parseChannel(value: string): number {
  const normalized = value.trim();
  return normalized.endsWith("%")
    ? clamp(Number.parseFloat(normalized) / 100) * 255
    : clamp(Number.parseFloat(normalized) / 255) * 255;
}

function parseAlpha(value: string | undefined): number {
  if (!value) return 1;
  const normalized = value.trim();
  return clamp(
    normalized.endsWith("%")
      ? Number.parseFloat(normalized) / 100
      : Number.parseFloat(normalized),
  );
}

function parseColor(value: string): RgbColor | null {
  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length <= 4
        ? hex
            .split("")
            .map((part) => part + part)
            .join("")
        : hex;
    if (![6, 8].includes(expanded.length)) return null;
    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
      alpha:
        expanded.length === 8
          ? Number.parseInt(expanded.slice(6, 8), 16) / 255
          : 1,
    };
  }

  const functionMatch = normalized.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!functionMatch) return null;
  const [, functionName, content] = functionMatch;
  const parts = content.split(",").map((part) => part.trim());

  if (functionName.startsWith("rgb")) {
    if (parts.length < 3 || parts.length > 4) return null;
    return {
      red: parseChannel(parts[0]),
      green: parseChannel(parts[1]),
      blue: parseChannel(parts[2]),
      alpha: parseAlpha(parts[3]),
    };
  }

  if (parts.length < 3 || parts.length > 4) return null;
  const hue = ((Number.parseFloat(parts[0]) % 360) + 360) % 360;
  const saturation = clamp(Number.parseFloat(parts[1]) / 100);
  const lightness = clamp(Number.parseFloat(parts[2]) / 100);
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const lightnessMatch = lightness - chroma / 2;

  return {
    red: (match[0] + lightnessMatch) * 255,
    green: (match[1] + lightnessMatch) * 255,
    blue: (match[2] + lightnessMatch) * 255,
    alpha: parseAlpha(parts[3]),
  };
}

function relativeLuminance(color: RgbColor): number {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: RgbColor, second: RgbColor): number {
  const brightest = Math.max(
    relativeLuminance(first),
    relativeLuminance(second),
  );
  const darkest = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (brightest + 0.05) / (darkest + 0.05);
}

export function getReadableForeground(
  background: string | null | undefined,
  fallback = "#111827",
): string {
  const parsed = background ? parseColor(background) : null;
  if (!parsed) return fallback;

  const blended = {
    ...parsed,
    red: parsed.red * parsed.alpha + 255 * (1 - parsed.alpha),
    green: parsed.green * parsed.alpha + 255 * (1 - parsed.alpha),
    blue: parsed.blue * parsed.alpha + 255 * (1 - parsed.alpha),
    alpha: 1,
  };
  const white: RgbColor = { red: 255, green: 255, blue: 255, alpha: 1 };
  const dark: RgbColor = { red: 17, green: 24, blue: 39, alpha: 1 };
  return contrastRatio(blended, white) >= contrastRatio(blended, dark)
    ? "#ffffff"
    : "#111827";
}

export function getContrastRatio(
  background: string,
  foreground: string,
): number | null {
  const backgroundColor = parseColor(background);
  const foregroundColor = parseColor(foreground);
  if (!backgroundColor || !foregroundColor) return null;
  return contrastRatio(backgroundColor, foregroundColor);
}
