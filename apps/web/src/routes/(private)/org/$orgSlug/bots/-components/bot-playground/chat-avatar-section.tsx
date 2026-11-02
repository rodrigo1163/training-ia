import type { Bot } from "@/api/bots/types";

import { ChatAvatarPicker } from "../chat-avatar-picker";

export function ChatAvatarSection({
  bot,
  botSlug,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  orgSlug: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <div>
        <h3 className="font-medium">Chat avatar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the image shown next to the assistant messages.
        </p>
      </div>
      <div className="mt-6">
        <ChatAvatarPicker bot={bot} botSlug={botSlug} orgSlug={orgSlug} />
      </div>
    </section>
  );
}
