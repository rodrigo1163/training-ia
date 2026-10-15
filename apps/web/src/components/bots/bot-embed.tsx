import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { Bot } from "@/components/bots/bots";
import { Button } from "@training-ia/ui/components/ui/button";

function CodeBlock({
  children,
  className,
  value,
}: {
  children: ReactNode;
  className?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-md bg-[#292c3f] p-5 text-xs leading-5 text-slate-100 shadow-sm ${className ?? "w-fit max-w-full"}`}
    >
      <Button
        aria-label={copied ? "Código copiado" : "Copiar código"}
        className="absolute top-2 right-2 text-slate-300 hover:bg-white/10 hover:text-white"
        onClick={handleCopy}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <pre className="w-full max-w-full overflow-x-auto pr-8 whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

export function BotEmbed({ bot }: { bot: Bot }) {
  const widgetDevUrl = "http://localhost:5174";
  const widgetPreviewUrl = `${widgetDevUrl}/?botId=${encodeURIComponent(bot.id)}`;
  const iframeCode = `<iframe
  src="${widgetPreviewUrl}"
  width="400px"
  height="600px"
  style="box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(150, 150, 150, 0.2) 0px 0px 1px;"
></iframe>`;
  const scriptCode = `<script
  type="module"
  async
  src="${widgetDevUrl}/src/embed.tsx"
  data-bot-id="${bot.id}"
></script>`;

  return (
    <div>
      <div className="flex w-fit max-w-full flex-col gap-8">
        <section className="w-full min-w-0">
          <h2 className="text-lg font-semibold">Code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy and paste the following code:
          </p>
          <div className="mt-3 w-full">
            <CodeBlock className="w-full" value={iframeCode}>
              <span className="text-rose-300">&lt;iframe</span>
              {"\n  "}
              <span className="text-sky-300">src</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">
                &quot;{widgetPreviewUrl}&quot;
              </span>
              {"\n  "}
              <span className="text-sky-300">width</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">&quot;400px&quot;</span>
              {"\n  "}
              <span className="text-sky-300">height</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">&quot;600px&quot;</span>
              {"\n  "}
              <span className="text-sky-300">style</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">
                &quot;box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(150, 150, 150, 0.2) 0px 0px 1px;&quot;
              </span>
              {"\n"}
              <span className="text-rose-300">&gt;&lt;/iframe&gt;</span>
            </CodeBlock>
          </div>
        </section>

        <section className="w-full min-w-0 border-t pt-8">
          <h2 className="text-lg font-semibold">Code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy and paste the following code:
          </p>
          <div className="mt-3 w-full">
            <CodeBlock className="w-full" value={scriptCode}>
              <span className="text-rose-300">&lt;script</span>
              {"\n  "}
              <span className="text-sky-300">type</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">&quot;module&quot;</span>
              {"\n  "}
              <span className="text-sky-300">async</span>
              {"\n  "}
              <span className="text-sky-300">src</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">
                &quot;{widgetDevUrl}/src/embed.tsx&quot;
              </span>
              {"\n  "}
              <span className="text-sky-300">data-bot-id</span>
              <span className="text-slate-300">=</span>
              <span className="text-emerald-300">&quot;{bot.id}&quot;</span>
              {"\n"}
              <span className="text-rose-300">&gt;&lt;/script&gt;</span>
            </CodeBlock>
          </div>
        </section>
      </div>
    </div>
  );
}
