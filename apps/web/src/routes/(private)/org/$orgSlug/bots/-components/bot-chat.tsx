import { useEffect, useRef } from "react";

import { env } from "@/env";
import { useDeploymentQuery } from "@/hooks/use-deployment";

const API_URL = env.VITE_API_URL;
const WIDGET_SCRIPT_URL = env.VITE_WIDGET_SCRIPT_URL;

function ChatUnavailable({ children }: { children: string }) {
  return (
    <div className="flex min-h-[32rem] items-center justify-center rounded-lg border border-dashed px-6 text-center">
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export function BotChat({
  orgSlug,
  botSlug,
}: {
  orgSlug: string;
  botSlug: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const query = useDeploymentQuery(orgSlug, botSlug);

  useEffect(() => {
    const container = containerRef.current;
    const deployment = query.data;
    if (!container || !deployment || deployment.status !== "ACTIVE") return;

    const script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.src = WIDGET_SCRIPT_URL;
    script.dataset.deploymentKey = deployment.publicKey;
    script.dataset.apiUrl = API_URL;
    script.dataset.displayMode = "inline";
    container.appendChild(script);
    window.dispatchEvent(
      new CustomEvent("training-ia:mount-chat-widget", {
        detail: { script },
      }),
    );

    return () => {
      script.remove();
      container
        .querySelector(`[data-widget-id="${CSS.escape(deployment.publicKey)}"]`)
        ?.remove();
    };
  }, [query.data]);

  if (query.isPending) {
    return <ChatUnavailable>Loading chatbot...</ChatUnavailable>;
  }

  if (query.isError) {
    return (
      <ChatUnavailable>
        Unable to load the chatbot. Please try again later.
      </ChatUnavailable>
    );
  }

  if (!query.data) {
    return (
      <ChatUnavailable>
        The bot has not been published yet. Use the Embed tab to publish and
        activate the chatbot.
      </ChatUnavailable>
    );
  }

  if (query.data.status !== "ACTIVE") {
    return (
      <ChatUnavailable>
        The chatbot is inactive. Use the Embed tab to reactivate it.
      </ChatUnavailable>
    );
  }

  return (
    <div
      className="flex min-h-[32rem] w-full items-center justify-center overflow-auto py-4"
      ref={containerRef}
    />
  );
}
