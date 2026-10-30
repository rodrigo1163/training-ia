import {
  CheckIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import { Input } from "@training-ia/ui/components/ui/input";
import { env } from "@/env";
import {
  useDeploymentMutation,
  useDeploymentQuery,
} from "@/hooks/use-deployment";
import { DeploymentError } from "./deployment-error";
import { DeploymentSkeleton } from "./deployment-skeleton";

const WIDGET_SCRIPT_URL = env.VITE_WIDGET_SCRIPT_URL;

type OriginsFormValues = {
  origins: { value: string }[];
};

function getOriginValues(allowedOrigins?: string[]): OriginsFormValues {
  const origins = (allowedOrigins ?? []).map((value) => ({ value }));

  return {
    origins: origins.length > 0 ? origins : [{ value: "" }],
  };
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
  const query = useDeploymentQuery(orgSlug, botSlug);
  const form = useForm<OriginsFormValues>({
    defaultValues: getOriginValues(),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "origins",
  });

  useEffect(() => {
    form.reset(getOriginValues(query.data?.allowedOrigins));
  }, [form, query.data?.allowedOrigins]);

  const originsMutation = useDeploymentMutation(
    orgSlug,
    botSlug,
    query.data?.status,
  );
  const statusMutation = useDeploymentMutation(
    orgSlug,
    botSlug,
    query.data?.status,
  );
  const originValues = form.watch("origins");
  const hasAllowedOrigin = originValues.some(({ value }) => value.trim());

  function onSubmit(values: OriginsFormValues) {
    const allowedOrigins = values.origins
      .map(({ value }) => value.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) return;

    originsMutation.mutate({
      action: query.data ? "save" : "publish",
      allowedOrigins,
    });
  }

  const snippet = useMemo(
    () =>
      query.data
        ? `<script\n  type="module"\n  async\n  src="${WIDGET_SCRIPT_URL}"\n  id="${query.data.publicKey}"\n  open="true"\n  openDelay="5000"\n></script>`
        : "",
    [query.data],
  );

  if (query.isPending) return <DeploymentSkeleton variant="embed" />;
  if (query.isError) {
    return <DeploymentError onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="w-full max-w-none space-y-6">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <section className="rounded-lg border bg-card p-6">
          <div>
            <h3 className="font-medium">Allowed origins</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Define which websites can load and use this bot.
            </p>
          </div>

          <div className="mt-6 min-w-0">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div className="min-w-0 space-y-2" key={field.id}>
                  <label
                    className="text-sm font-medium"
                    htmlFor={`allowed-origin-${field.id}`}
                  >
                    Allowed origin {index + 1}
                  </label>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      disabled={originsMutation.isPending}
                      id={`allowed-origin-${field.id}`}
                      placeholder="https://exemplo.com"
                      {...form.register(`origins.${index}.value`)}
                    />
                    <Button
                      aria-label={`Remove allowed origin ${index + 1}`}
                      disabled={
                        originsMutation.isPending || fields.length === 1
                      }
                      onClick={() => remove(index)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter one HTTP(S) origin per field.
            </p>
            <Button
              className="mt-4"
              disabled={originsMutation.isPending}
              onClick={() => append({ value: "" })}
              type="button"
              variant="outline"
            >
              <PlusIcon aria-hidden="true" />
              Add origin
            </Button>
            {originsMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                {originsMutation.error.message}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                disabled={originsMutation.isPending || !hasAllowedOrigin}
                type="submit"
              >
                {originsMutation.isPending
                  ? "Saving..."
                  : query.data
                    ? "Save origins"
                    : "Publish bot"}
                {originsMutation.isPending && <ButtonSpinner />}
              </Button>
            </div>
          </div>
        </section>
      </form>

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

          {query.data && (
            <Button
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ action: "toggle" })}
              type="button"
              variant="outline"
            >
              {query.data.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              {statusMutation.isPending && <ButtonSpinner />}
            </Button>
          )}
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
              The installation script will be generated after the bot is
              published.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
