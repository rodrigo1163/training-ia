export interface EmbedConfig {
  deploymentKey: string;
  apiUrl: string;
}

export function readEmbedConfig(script: HTMLScriptElement | null): EmbedConfig | null {
  const deploymentKey = script?.dataset.deploymentKey?.trim();
  const apiUrl = script?.dataset.apiUrl?.trim();
  if (!deploymentKey || !apiUrl) return null;
  try {
    const url = new URL(apiUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return { deploymentKey, apiUrl: url.origin + url.pathname.replace(/\/$/, '') };
  } catch {
    return null;
  }
}
