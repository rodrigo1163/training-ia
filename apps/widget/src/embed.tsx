import { createRoot } from "react-dom/client";
import styles from "./styles/widget.css?inline";
import { ChatWidget } from "./chat-widget";

const script = document.currentScript as
  | HTMLScriptElement
  | null;

function initialize() {
  if (!script) return;

  const botId = script.dataset.botId;

  if (!botId) {
    console.error("Widget: data-bot-id é obrigatório");
    return;
  }

  const host = document.createElement("div");

  host.dataset.widgetId = botId;

  Object.assign(host.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
  });

  const shadow = host.attachShadow({
    mode: "open",
  });

  const style = document.createElement("style");
  style.textContent = styles;

  const container = document.createElement("div");

  shadow.append(style, container);
  document.body.appendChild(host);

  createRoot(container).render(
    <ChatWidget botId={botId} />,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, {
    once: true,
  });
} else {
  initialize();
}