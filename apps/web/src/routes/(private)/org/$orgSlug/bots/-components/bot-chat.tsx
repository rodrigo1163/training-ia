import { useEffect, useRef, useState } from "react";

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
    <div className="flex min-h-[32rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card px-6 text-center">
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
  const [widgetScriptStatus, setWidgetScriptStatus] = useState<{
    deploymentKey: string;
    attempt: number;
    status: "loading" | "loaded" | "error";
  } | null>(null);
  const [scriptAttempt, setScriptAttempt] = useState(0);
  const query = useDeploymentQuery(orgSlug, botSlug);
  const deploymentKey = query.data?.publicKey;
  const deploymentStatus = query.data?.status;

  chatConfigRef.current = chatConfig;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !deploymentKey || deploymentStatus !== "ACTIVE") return;

    let cancelled = false;

    const script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.src = WIDGET_SCRIPT_URL;
    script.id = deploymentKey;
    script.setAttribute("open", "true");
    script.setAttribute("displayMode", "inline");
    script.setAttribute("mode", "test");

    const mountWidget = () => {
      if (cancelled) return;

      window.dispatchEvent(
        new CustomEvent("training-ia:mount-chat-widget", {
          detail: {
            script,
            chatConfig: chatConfigRef.current,
            mode: "test",
          },
        }),
      );
      setWidgetScriptStatus({
        deploymentKey,
        attempt: scriptAttempt,
        status: "loaded",
      });
    };
    const handleScriptError = () => {
      if (cancelled) return;

      setWidgetScriptStatus({
        deploymentKey,
        attempt: scriptAttempt,
        status: "error",
      });
    };

    script.addEventListener("load", mountWidget, { once: true });
    script.addEventListener("error", handleScriptError, { once: true });
    container.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", mountWidget);
      script.removeEventListener("error", handleScriptError);
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
  }, [deploymentKey, deploymentStatus, scriptAttempt]);

  useEffect(() => {
    if (!deploymentKey || deploymentStatus !== "ACTIVE") return;

    window.dispatchEvent(
      new CustomEvent("training-ia:update-chat-widget", {
        detail: { chatConfig, deploymentKey },
      }),
    );
  }, [chatConfig, deploymentKey, deploymentStatus]);

  if (query.isPending) return <DeploymentSkeleton variant="chat" />;

  if (query.isError && !query.data) {
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

  const currentScriptStatus =
    widgetScriptStatus &&
    widgetScriptStatus.deploymentKey === deploymentKey &&
    widgetScriptStatus.attempt === scriptAttempt
      ? widgetScriptStatus.status
      : "loading";
  const isWidgetScriptLoading = currentScriptStatus === "loading";
  const isWidgetScriptError = currentScriptStatus === "error";

  return (
    <div className="relative min-h-[32rem] w-full min-w-0">
      <div
        aria-hidden={isWidgetScriptError || undefined}
        className={
          isWidgetScriptError ? "hidden" : "min-h-[32rem] w-full min-w-0"
        }
        ref={containerRef}
      />
      {isWidgetScriptLoading && (
        <div aria-live="polite" className="absolute inset-0" role="status">
          <span className="sr-only">Loading chat preview.</span>
          <DeploymentSkeleton variant="chat" />
        </div>
      )}
      {isWidgetScriptError && (
        <div className="absolute inset-0">
          <ChatUnavailable
            action={{
              label: "Try again",
              onClick: () => setScriptAttempt((attempt) => attempt + 1),
            }}
            description="The chat preview could not be loaded. Check your connection and try again."
            title="Unable to load the chat preview"
          />
        </div>
      )}
    </div>
  );
}
