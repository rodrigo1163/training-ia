type RgbaColor = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseAlpha(value: string | undefined) {
  if (value === undefined) return 1;
  const normalized = value.trim();
  const alpha = normalized.endsWith("%")
    ? Number.parseFloat(normalized) / 100
    : Number.parseFloat(normalized);
  return Number.isFinite(alpha) ? clamp(alpha, 0, 1) : null;
}

function parseColor(value: string): RgbaColor | null {
  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3 || hex.length === 4
        ? hex
            .split("")
            .map((part) => part + part)
            .join("")
        : hex;
    if (expanded.length !== 6 && expanded.length !== 8) return null;

    const channels = [0, 2, 4].map((offset) =>
      Number.parseInt(expanded.slice(offset, offset + 2), 16),
    );
    const alpha =
      expanded.length === 8
        ? Number.parseInt(expanded.slice(6, 8), 16) / 255
        : 1;
    if (channels.some((channel) => !Number.isFinite(channel))) return null;

    return {
      red: channels[0],
      green: channels[1],
      blue: channels[2],
      alpha,
    };
  }

  const match = normalized.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!match) return null;

  const [, functionName, content] = match;
  const parts = content.split(",").map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) return null;

  const alpha = parseAlpha(parts[3]);
  if (alpha === null) return null;

  if (functionName.startsWith("rgb")) {
    const channels = parts.slice(0, 3).map((part) => {
      const value = Number.parseFloat(part);
      return part.endsWith("%")
        ? (clamp(value, 0, 100) / 100) * 255
        : clamp(value, 0, 255);
    });
    if (channels.some((channel) => !Number.isFinite(channel))) return null;
    return {
      red: channels[0],
      green: channels[1],
      blue: channels[2],
      alpha,
    };
  }

  const hueValue = Number.parseFloat(parts[0]);
  const saturationValue = Number.parseFloat(parts[1]);
  const lightnessValue = Number.parseFloat(parts[2]);
  if (
    !Number.isFinite(hueValue) ||
    !Number.isFinite(saturationValue) ||
    !Number.isFinite(lightnessValue) ||
    !parts[1].endsWith("%") ||
    !parts[2].endsWith("%")
  ) {
    return null;
  }

  const hue = ((hueValue % 360) + 360) % 360;
  const saturation = clamp(saturationValue / 100, 0, 1);
  const lightness = clamp(lightnessValue / 100, 0, 1);
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const channels =
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
  const matchValue = lightness - chroma / 2;

  return {
    red: (channels[0] + matchValue) * 255,
    green: (channels[1] + matchValue) * 255,
    blue: (channels[2] + matchValue) * 255,
    alpha,
  };
}

function composite(foreground: RgbaColor, background: RgbaColor): RgbaColor {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };

  return {
    red:
      (foreground.red * foreground.alpha +
        background.red * background.alpha * (1 - foreground.alpha)) /
      alpha,
    green:
      (foreground.green * foreground.alpha +
        background.green * background.alpha * (1 - foreground.alpha)) /
      alpha,
    blue:
      (foreground.blue * foreground.alpha +
        background.blue * background.alpha * (1 - foreground.alpha)) /
      alpha,
    alpha,
  };
}

function relativeLuminance(color: RgbaColor) {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getChatMessageContrastRatio(
  textColor: string,
  messageBackgroundColor: string,
  chatBackgroundColor: string,
): number | null {
  const text = parseColor(textColor);
  const messageBackground = parseColor(messageBackgroundColor);
  const chatBackground = parseColor(chatBackgroundColor);
  const pageBackground = parseColor("#ffffff");
  if (!text || !messageBackground || !chatBackground || !pageBackground) {
    return null;
  }

  const effectiveChatBackground = composite(chatBackground, pageBackground);
  const effectiveMessageBackground = composite(
    messageBackground,
    effectiveChatBackground,
  );
  const effectiveText = composite(text, effectiveMessageBackground);
  const brightest = Math.max(
    relativeLuminance(effectiveText),
    relativeLuminance(effectiveMessageBackground),
  );
  const darkest = Math.min(
    relativeLuminance(effectiveText),
    relativeLuminance(effectiveMessageBackground),
  );
  return (brightest + 0.05) / (darkest + 0.05);
}
