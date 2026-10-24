import { useEffect, useRef } from "react";

import { Skeleton } from "@training-ia/ui/components/ui/skeleton";
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

function ChatSkeleton() {
  return (
    <div
      aria-label="Loading chatbot"
      className="flex min-h-[32rem] w-full items-center justify-center overflow-auto py-4"
      role="status"
    >
      <div className="flex h-[min(676px,calc(100dvh-12rem))] min-h-[360px] w-[424px] max-w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 bg-primary px-4 py-3.5">
          <Skeleton className="size-9 rounded-full bg-primary-foreground/20" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
            <Skeleton className="h-3 w-20 bg-primary-foreground/20" />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-2/3 rounded-lg" />
          </div>
          <div className="flex">
            <Skeleton className="h-20 w-4/5 rounded-lg" />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border bg-card p-3">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
          <Skeleton className="h-10 w-16 rounded-md" />
        </div>
        <Skeleton className="h-7 rounded-none" />
      </div>
      <span className="sr-only">Loading chatbot...</span>
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

  if (query.isPending) {
    return <ChatSkeleton />;
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
    <div className="relative min-h-[32rem] w-full min-w-0" ref={containerRef} />
  );
}
