import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { deploymentQueryKey, fetchDeployment } from "./deployment";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const WIDGET_SCRIPT_URL = import.meta.env.VITE_WIDGET_SCRIPT_URL ?? "http://localhost:5174/src/embed.tsx";

function ChatUnavailable({ children }: { children: string }) {
  return (
    <div className="flex min-h-[32rem] items-center justify-center rounded-lg border border-dashed px-6 text-center">
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export function BotChat({ orgSlug, botSlug }: { orgSlug: string; botSlug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: deploymentQueryKey(orgSlug, botSlug),
    queryFn: () => fetchDeployment(orgSlug, botSlug),
  });

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
      container.querySelector(`[data-widget-id="${CSS.escape(deployment.publicKey)}"]`)?.remove();
    };
  }, [query.data]);

  if (query.isPending) {
    return <ChatUnavailable>Carregando chatbot...</ChatUnavailable>;
  }

  if (query.isError) {
    return <ChatUnavailable>Não foi possível carregar o chatbot. Tente novamente mais tarde.</ChatUnavailable>;
  }

  if (!query.data) {
    return <ChatUnavailable>O bot ainda não foi publicado. Use a aba Embed para publicar e ativar o chatbot.</ChatUnavailable>;
  }

  if (query.data.status !== "ACTIVE") {
    return <ChatUnavailable>O chatbot está inativo. Use a aba Embed para reativá-lo.</ChatUnavailable>;
  }

  return <div className="flex min-h-[32rem] w-full items-center justify-center overflow-auto py-4" ref={containerRef} />;
}
