import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import { deploymentQueryKey, editDeployment, fetchDeployment, publishDeployment } from "./deployment";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const WIDGET_SCRIPT_URL = import.meta.env.VITE_WIDGET_SCRIPT_URL ?? "http://localhost:5174/src/embed.tsx";

function parseOrigins(value: string) {
  return value.split(/\r?\n/).map((origin) => origin.trim()).filter(Boolean);
}

function CodeBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative overflow-hidden rounded-md bg-[#292c3f] p-5 text-xs leading-5 text-slate-100 shadow-sm">
      <Button aria-label={copied ? "Código copiado" : "Copiar código"} className="absolute top-2 right-2 text-slate-300 hover:bg-white/10 hover:text-white" onClick={copy} size="icon-sm" type="button" variant="ghost">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <pre className="overflow-x-auto pr-8 whitespace-pre-wrap">{value}</pre>
    </div>
  );
}

export function BotEmbed({ orgSlug, botSlug }: { orgSlug: string; botSlug: string }) {
  const queryClient = useQueryClient();
  const [origins, setOrigins] = useState("");
  const query = useQuery({
    queryKey: deploymentQueryKey(orgSlug, botSlug),
    queryFn: () => fetchDeployment(orgSlug, botSlug),
  });
  useEffect(() => {
    if (query.data) setOrigins(query.data.allowedOrigins.join("\n"));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async (input: { action: "publish" | "save" | "toggle" }) => {
      if (input.action === "publish") return publishDeployment(orgSlug, botSlug, parseOrigins(origins));
      if (input.action === "save") return editDeployment(orgSlug, botSlug, { allowedOrigins: parseOrigins(origins) });
      return editDeployment(orgSlug, botSlug, { status: query.data?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
    },
    onSuccess: (deployment) => queryClient.setQueryData(deploymentQueryKey(orgSlug, botSlug), deployment),
  });

  const snippet = useMemo(() => query.data
    ? `<script\n  type="module"\n  async\n  src="${WIDGET_SCRIPT_URL}"\n  data-deployment-key="${query.data.publicKey}"\n  data-api-url="${API_URL}"\n></script>`
    : "", [query.data]);

  if (query.isPending) return <p className="text-sm text-muted-foreground">Carregando publicação...</p>;
  if (query.isError) return <p className="text-sm text-destructive">Não foi possível carregar a publicação.</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section>
        <h2 className="text-lg font-semibold">Publicação</h2>
        <p className="mt-1 text-sm text-muted-foreground">Informe uma origem HTTP(S) por linha. Apenas páginas nessas origens poderão usar o bot.</p>
        <Textarea className="mt-3 min-h-28" onChange={(event) => setOrigins(event.target.value)} placeholder="https://exemplo.com" value={origins} />
        {mutation.isError ? <p className="mt-2 text-sm text-destructive">{mutation.error.message}</p> : null}
        <div className="mt-3 flex gap-2">
          {!query.data ? (
            <Button disabled={mutation.isPending || parseOrigins(origins).length === 0} onClick={() => mutation.mutate({ action: "publish" })} type="button">Publicar bot</Button>
          ) : (
            <>
              <Button disabled={mutation.isPending || parseOrigins(origins).length === 0} onClick={() => mutation.mutate({ action: "save" })} type="button">Salvar origens</Button>
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "toggle" })} type="button" variant="outline">
                {query.data.status === "ACTIVE" ? "Desativar" : "Reativar"}
              </Button>
            </>
          )}
        </div>
      </section>

      {query.data ? (
        <section className="border-t pt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Script de incorporação</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${query.data.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
              {query.data.status === "ACTIVE" ? "Ativo" : "Inativo"}
            </span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">Cole este script antes do fechamento da tag body da aplicação cliente.</p>
          <CodeBlock value={snippet} />
        </section>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">O bot ainda não foi publicado. O script será gerado após a publicação.</p>
      )}
    </div>
  );
}
