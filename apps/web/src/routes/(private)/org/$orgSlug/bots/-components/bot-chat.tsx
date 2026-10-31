import { useEffect, useRef } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import { env } from "@/env";
import { useDeploymentQuery } from "@/hooks/use-deployment";
import type { ChatConfig } from "@/api/bots/types";

import { DeploymentError } from "./deployment-error";
import { DeploymentSkeleton } from "./deployment-skeleton";

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
      {action && (
        <Button className="mt-2" onClick={action.onClick} type="button">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function BotChat({
  onOpenEmbed,
  orgSlug,
  botSlug,
  chatConfig,
}: {
  onOpenEmbed: () => Promise<void>;
  orgSlug: string;
  botSlug: string;
  chatConfig: ChatConfig;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatConfigRef = useRef(chatConfig);
  const query = useDeploymentQuery(orgSlug, botSlug);
  const deploymentKey = query.data?.publicKey;
  const deploymentStatus = query.data?.status;

  chatConfigRef.current = chatConfig;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !deploymentKey || deploymentStatus !== "ACTIVE") return;

    const script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.src = WIDGET_SCRIPT_URL;
    script.id = deploymentKey;
    script.setAttribute("open", "true");
    script.setAttribute("displayMode", "inline");
    script.setAttribute("mode", "test");

    const mountWidget = () => {
      window.dispatchEvent(
        new CustomEvent("training-ia:mount-chat-widget", {
          detail: {
            script,
            chatConfig: chatConfigRef.current,
            mode: "test",
          },
        }),
      );
    };

    script.addEventListener("load", mountWidget, { once: true });
    container.appendChild(script);
    mountWidget();

    return () => {
      script.removeEventListener("load", mountWidget);
      window.dispatchEvent(
        new CustomEvent("training-ia:unmount-chat-widget", {
          detail: {
            deploymentKey,
            script,
          },
        }),
      );
      script.remove();
    };
  }, [deploymentKey, deploymentStatus]);

  useEffect(() => {
    if (!deploymentKey || deploymentStatus !== "ACTIVE") return;

    window.dispatchEvent(
      new CustomEvent("training-ia:update-chat-widget", {
        detail: { chatConfig, deploymentKey },
      }),
    );
  }, [chatConfig, deploymentKey, deploymentStatus]);

  if (query.isPending) return <DeploymentSkeleton variant="chat" />;

  if (query.isError) {
    return (
      <DeploymentError
        onOpenEmbed={onOpenEmbed}
        onRetry={() => void query.refetch()}
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
