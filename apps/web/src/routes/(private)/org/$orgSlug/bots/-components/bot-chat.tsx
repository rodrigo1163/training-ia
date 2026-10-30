import { useEffect, useRef } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import { env } from "@/env";
import { useDeploymentQuery } from "@/hooks/use-deployment";

const WIDGET_SCRIPT_URL = env.VITE_WIDGET_SCRIPT_URL;

function ChatUnavailable({
  action,
  description,
  title,
}: {
  action?: { label: string; onClick: () => void };
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-[32rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
      <h2 className="font-medium">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button className="mt-2" onClick={action.onClick} type="button">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function BotChat({
  onOpenEmbed,
  orgSlug,
  botSlug,
}: {
  onOpenEmbed: () => Promise<void>;
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
    script.setAttribute("displayMode", "inline");
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

  if (query.isPending) return null;

  if (query.isError) {
    return (
      <ChatUnavailable
        description="Please try again later."
        title="Unable to load the chatbot"
      />
    );
  }

  if (!query.data) {
    return (
      <ChatUnavailable
        action={{ label: "Configure publication", onClick: onOpenEmbed }}
        description="Publish the bot to start testing conversations here."
        title="The bot is not published yet"
      />
    );
  }

  if (query.data.status !== "ACTIVE") {
    return (
      <ChatUnavailable
        action={{ label: "Manage publication", onClick: onOpenEmbed }}
        description="Reactivate the bot in Embed to start testing conversations."
        title="The chatbot is inactive"
      />
    );
  }

  return (
    <div
      className="flex min-h-[32rem] w-full min-w-0 items-center justify-center rounded-lg border bg-muted/20 p-4"
      ref={containerRef}
    />
  );
}
