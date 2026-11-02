import { createRoot } from "react-dom/client";
import styles from "./styles/tailwind.css?inline";
import { ChatWidget } from "./components/chat-widget";
import { env } from "./env";
import { readEmbedConfig } from "./helpers/embed-config";
import type { ChatConfig } from "./types/chat";

type WidgetInstance = {
  host: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  props: {
    apiUrl: string;
    deploymentKey: string;
    displayMode: "floating" | "inline";
    initiallyOpen?: boolean;
    openDelay?: number;
    mode?: "test" | "public";
    chatConfig?: ChatConfig;
    onFloatingPositionChange: (
      position: "bottom-right" | "bottom-left",
    ) => void;
  };
};

const widgetInstances = new Map<string, WidgetInstance>();

function renderInstance(instance: WidgetInstance) {
  instance.root.render(<ChatWidget {...instance.props} />);
}

function getEmbedScript() {
  const currentScript = document.currentScript;
  if (currentScript instanceof HTMLScriptElement) return currentScript;

  return document.querySelector<HTMLScriptElement>(
    "script[id][open], script[data-deployment-key]",
  );
}

function initialize(
  script = getEmbedScript(),
  overrides?: { chatConfig?: ChatConfig; mode?: "test" | "public" },
) {
  if (!script?.isConnected) return;

  const config = readEmbedConfig(script);
  if (!config) {
    console.error("Widget: a bot id is required.");
    return;
  }

  const existingInstance = widgetInstances.get(config.deploymentKey);
  if (existingInstance) {
    if (overrides?.chatConfig) {
      existingInstance.props.chatConfig = overrides.chatConfig;
    }
    if (overrides?.mode) {
      existingInstance.props.mode = overrides.mode;
    }
    renderInstance(existingInstance);
    return;
  }

  const existingHost = document.querySelector(
    `[data-widget-id="${CSS.escape(config.deploymentKey)}"]`,
  );
  if (existingHost) return;

  const host = document.createElement("div");
  host.dataset.widgetId = config.deploymentKey;
  if (config.displayMode === "inline") {
    host.style.width = "100%";
  } else {
    Object.assign(host.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      width: "max-content",
      maxWidth: "calc(100vw - 48px)",
    });
  }
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  const container = document.createElement("div");
  const mode = overrides?.mode ?? config.mode;
  shadow.append(style, container);
  const mountTarget =
    config.displayMode === "inline" ? script.parentElement : document.body;
  (mountTarget ?? document.body).appendChild(host);
  const root = createRoot(container);
  const instance: WidgetInstance = {
    host,
    root,
    props: {
      apiUrl: env.VITE_API_URL,
      deploymentKey: config.deploymentKey,
      displayMode: config.displayMode,
      initiallyOpen: config.initiallyOpen,
      openDelay: config.openDelay,
      mode,
      chatConfig: overrides?.chatConfig,
      onFloatingPositionChange: (position) => {
        if (config.displayMode !== "floating") return;

        host.style.left = position === "bottom-left" ? "24px" : "auto";
        host.style.right = position === "bottom-right" ? "24px" : "auto";
      },
    },
  };
  widgetInstances.set(config.deploymentKey, instance);
  renderInstance(instance);
}

function unmount(deploymentKey: string | undefined) {
  if (!deploymentKey) return;

  const instance = widgetInstances.get(deploymentKey);
  if (!instance) return;

  instance.root.unmount();
  instance.host.remove();
  widgetInstances.delete(deploymentKey);
}

window.addEventListener("training-ia:mount-chat-widget", (event) => {
  const detail = (
    event as CustomEvent<{
      script?: HTMLScriptElement;
      chatConfig?: ChatConfig;
      mode?: "test" | "public";
    }>
  ).detail;
  initialize(detail?.script, detail);
});

window.addEventListener("training-ia:update-chat-widget", (event) => {
  const detail = (
    event as CustomEvent<{
      deploymentKey?: string;
      chatConfig?: ChatConfig;
    }>
  ).detail;
  if (!detail?.deploymentKey || !detail.chatConfig) return;

  const instance = widgetInstances.get(detail.deploymentKey);
  if (!instance) return;

  instance.props.chatConfig = detail.chatConfig;
  renderInstance(instance);
});

window.addEventListener("training-ia:unmount-chat-widget", (event) => {
  const detail = (
    event as CustomEvent<{ deploymentKey?: string; script?: HTMLScriptElement }>
  ).detail;
  const deploymentKey =
    detail?.deploymentKey ??
    detail?.script?.id ??
    detail?.script?.dataset.deploymentKey;
  unmount(deploymentKey);
});

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", () => initialize(), {
    once: true,
  });
else initialize();
