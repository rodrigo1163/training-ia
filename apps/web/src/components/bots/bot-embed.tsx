import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import {
  deploymentQueryKey,
  editDeployment,
  fetchDeployment,
  publishDeployment,
} from "./deployment";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const WIDGET_SCRIPT_URL =
  import.meta.env.VITE_WIDGET_SCRIPT_URL ??
  "http://localhost:5174/src/embed.tsx";

function parseOrigins(value: string) {
  return value
    .split(/\r?\n/)
    .map((origin) => origin.trim())
    .filter(Boolean);
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
      <Button
        aria-label={copied ? "Code copied" : "Copy code"}
        className="absolute top-2 right-2 text-slate-300 hover:bg-white/10 hover:text-white"
        onClick={copy}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <pre className="overflow-x-auto pr-8 whitespace-pre-wrap">{value}</pre>
    </div>
  );
}

export function BotEmbed({
  orgSlug,
  botSlug,
}: {
  orgSlug: string;
  botSlug: string;
}) {
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
      if (input.action === "publish")
        return publishDeployment(orgSlug, botSlug, parseOrigins(origins));
      if (input.action === "save")
        return editDeployment(orgSlug, botSlug, {
          allowedOrigins: parseOrigins(origins),
        });
      return editDeployment(orgSlug, botSlug, {
        status: query.data?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    },
    onSuccess: (deployment) =>
      queryClient.setQueryData(
        deploymentQueryKey(orgSlug, botSlug),
        deployment,
      ),
  });

  const snippet = useMemo(
    () =>
      query.data
        ? `<script\n  type="module"\n  async\n  src="${WIDGET_SCRIPT_URL}"\n  data-deployment-key="${query.data.publicKey}"\n  data-api-url="${API_URL}"\n></script>`
        : "",
    [query.data],
  );

  if (query.isPending)
    return (
      <p className="text-sm text-muted-foreground">Loading deployment...</p>
    );
  if (query.isError)
    return (
      <p className="text-sm text-destructive">
        Unable to load the deployment.
      </p>
    );

  return (
    <div className="w-full max-w-none space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Allowed origins</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Define which websites can load and use this bot.
          </p>
        </div>

        <div className="mt-6 min-w-0">
          <Textarea
            className="min-h-28"
            disabled={mutation.isPending}
            onChange={(event) => setOrigins(event.target.value)}
            placeholder="https://exemplo.com"
            value={origins}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Enter one HTTP(S) origin per line.
          </p>
          {mutation.isError ? (
            <p className="mt-2 text-sm text-destructive">
              {mutation.error.message}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={
                mutation.isPending || parseOrigins(origins).length === 0
              }
              onClick={() =>
                mutation.mutate({ action: query.data ? "save" : "publish" })
              }
              type="button"
            >
              {mutation.isPending
                ? "Saving..."
                : query.data
                  ? "Save origins"
                  : "Publish bot"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Deployment status</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Control the bot's availability on authorized websites.
          </p>
        </div>

        <div className="mt-6 flex min-w-0 items-center justify-between gap-4">
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                query.data?.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {query.data
                ? query.data.status === "ACTIVE"
                  ? "Active"
                  : "Inactive"
                : "Not published"}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              {query.data
                ? query.data.status === "ACTIVE"
                  ? "The bot is available for use."
                  : "The bot is temporarily unavailable."
                : "Publish the bot to make it available on other websites."}
            </p>
          </div>

          {query.data ? (
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: "toggle" })}
              type="button"
              variant="outline"
            >
              {query.data.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Widget installation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the chatbot to your client application code.
          </p>
        </div>

        <div className="mt-6 min-w-0">
          {query.data ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Paste this script before the closing body tag.
              </p>
              <CodeBlock value={snippet} />
            </>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              The installation script will be generated after the bot is published.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
