import { useEffect, useRef } from "react";
import { env } from "@/env";
import { useDeploymentQuery } from "@/hooks/use-deployment";

const OPEN_DELAY = "5000";
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
    script.id = deployment.publicKey;
    script.setAttribute("open", "true");
    script.setAttribute("openDelay", OPEN_DELAY);
    container.appendChild(script);
    window.dispatchEvent(
      new CustomEvent("training-ia:mount-chat-widget", {
        detail: { script },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("training-ia:unmount-chat-widget", {
          detail: {
            deploymentKey: deployment.publicKey,
            script,
          },
        }),
      );
      script.remove();
    };
  }, [query.data]);

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
    <div className="relative min-h-[32rem] w-full min-w-0" ref={containerRef} />
  );
}
