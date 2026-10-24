import { createRoot } from "react-dom/client";
import styles from "./styles/tailwind.css?inline";
import { ChatWidget } from "./components/chat-widget";
import { env } from "./env";
import { readEmbedConfig } from "./helpers/embed-config";

type WidgetInstance = {
  host: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
};

const widgetInstances = new Map<string, WidgetInstance>();

function getEmbedScript() {
  const currentScript = document.currentScript;
  if (currentScript instanceof HTMLScriptElement) return currentScript;

  return document.querySelector<HTMLScriptElement>(
    "script[id][open], script[data-deployment-key]",
  );
}

function initialize(script = getEmbedScript()) {
  if (!script?.isConnected) return;

  const config = readEmbedConfig(script);
  if (!config) {
    console.error("Widget: a bot id is required.");
    return;
  }

  if (widgetInstances.has(config.deploymentKey)) return;

  const existingHost = document.querySelector(
    `[data-widget-id="${CSS.escape(config.deploymentKey)}"]`,
  );
  if (existingHost) return;

  const host = document.createElement("div");
  host.dataset.widgetId = config.deploymentKey;
  Object.assign(host.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
  });
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  const container = document.createElement("div");
  shadow.append(style, container);
  document.body.appendChild(host);
  const root = createRoot(container);
  root.render(
    <ChatWidget
      apiUrl={env.VITE_API_URL}
      deploymentKey={config.deploymentKey}
      initiallyOpen={config.initiallyOpen}
      openDelay={config.openDelay}
    />,
  );
  widgetInstances.set(config.deploymentKey, { host, root });
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
  const script = (event as CustomEvent<{ script?: HTMLScriptElement }>).detail
    ?.script;
  initialize(script);
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
