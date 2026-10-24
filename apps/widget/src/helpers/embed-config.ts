import type { EmbedConfig } from "../types/embed";

function parseBoolean(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function parseDelay(value: string | null | undefined) {
  const delay = Number(value);
  return Number.isFinite(delay) && delay >= 0 ? delay : 0;
}

export function readEmbedConfig(
  script: HTMLScriptElement | null,
): EmbedConfig | null {
  if (!script) return null;

  const deploymentKey =
    script.id.trim() || script.dataset.deploymentKey?.trim();
  if (!deploymentKey) return null;

  const openValue = script.getAttribute("open") ?? script.dataset.open;
  const openDelayValue =
    script.getAttribute("openDelay") ??
    script.getAttribute("opendelay") ??
    script.dataset.openDelay;

  return {
    deploymentKey,
    initiallyOpen: parseBoolean(openValue),
    openDelay: parseDelay(openDelayValue),
  };
}
