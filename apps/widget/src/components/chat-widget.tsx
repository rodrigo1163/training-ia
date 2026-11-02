import { MessageScroller } from "@shadcn/react/message-scroller";
import Markdown from "react-markdown";
import { useState } from "react";
import { Button } from "@training-ia/ui/components/ui/button";
import { Input } from "@training-ia/ui/components/ui/input";
import { useChatWidget } from "../hooks/use-chat-widget";
import { getReadableForeground } from "@training-ia/ui/helpers/chat-colors";
import type { ChatWidgetProps } from "../types/chat";

function ChatAvatar({
  className,
  url,
}: {
  className?: string;
  url: string | null;
}) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) return "🤖";

  return (
    <img
      alt=""
      className={className}
      onError={() => setHasError(true)}
      src={url}
    />
  );
}

export function ChatWidget(props: ChatWidgetProps) {
  const {
    handleClearConversation,
    handleSendMessage,
    handleStarterQuestion,
    handleStopMessage,
    input,
    isInline,
    isOpen,
    loadingMessage,
    mode,
    config,
    setInput,
    setIsOpen,
    state,
  } = useChatWidget(props);
  const chatForeground = getReadableForeground(config.chatBackgroundColor);
  const headerForeground = getReadableForeground(
    config.headerFooterBackgroundColor,
    "#ffffff",
  );
  const assistantForeground = getReadableForeground(
    config.assistantMessageBackgroundColor,
  );
  const userForeground = getReadableForeground(
    config.userMessageBackgroundColor,
    "#ffffff",
  );
  const actionBackground =
    config.userMessageBackgroundColor ?? config.headerFooterBackgroundColor;
  const actionForeground = getReadableForeground(actionBackground, "#ffffff");

  return (
    <div
      className={
        isInline
          ? "flex w-full justify-center font-sans"
          : "flex flex-col items-end font-sans"
      }
    >
      {isOpen && (
        <section
          className={`${isInline ? "h-[min(676px,calc(100dvh-12rem))] min-h-[360px] w-[424px] max-w-full" : "mb-4 h-[676px] w-[424px]"} flex flex-col overflow-hidden rounded-xl bg-card shadow-2xl`}
          style={{
            backgroundColor: config.chatBackgroundColor ?? undefined,
            color: config.chatBackgroundColor ? chatForeground : undefined,
          }}
        >
          <header
            className="flex items-center gap-3 bg-primary px-4 py-3.5 text-primary-foreground"
            style={{
              backgroundColor: config.headerFooterBackgroundColor ?? undefined,
              color: config.headerFooterBackgroundColor
                ? headerForeground
                : undefined,
            }}
          >
            <div className="grid size-9 place-items-center rounded-full bg-primary-foreground/15 text-lg">
              <ChatAvatar
                className="size-full rounded-full object-cover"
                key={config.avatarUrl ?? "fallback"}
                url={config.avatarUrl}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <strong className="text-sm font-semibold">
                Virtual Assistant
              </strong>
              {config.headerStatusText && (
                <span className="text-xs opacity-70">
                  {config.headerStatusText}
                </span>
              )}
            </div>
            {mode === "test" && (
              <Button
                type="button"
                className="rounded-md text-primary-foreground hover:bg-black/10 hover:text-inherit focus-visible:ring-[3px] focus-visible:ring-current/50"
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                disabled={state.messages.length <= 1 && !state.isGenerating}
                style={{
                  color: config.headerFooterBackgroundColor
                    ? headerForeground
                    : undefined,
                }}
              >
                Clear
              </Button>
            )}
            {!isInline && (
              <Button
                type="button"
                className="rounded-md text-primary-foreground hover:bg-black/10 hover:text-inherit focus-visible:ring-[3px] focus-visible:ring-current/50"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close conversation"
                style={{
                  color: config.headerFooterBackgroundColor
                    ? headerForeground
                    : undefined,
                }}
              >
                ✕
              </Button>
            )}
          </header>

          <MessageScroller.Provider
            autoScroll
            defaultScrollPosition="end"
            scrollPreviousItemPeek={48}
          >
            <MessageScroller.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <MessageScroller.Viewport
                className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[pending-scroll]:invisible"
                aria-label="Conversation messages"
              >
                <MessageScroller.Content className="flex min-h-full flex-col gap-3 p-4">
                  {state.messages.map((message) => (
                    <MessageScroller.Item
                      key={message.id}
                      className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <div
                        className={`flex w-full items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-black/10 text-sm">
                            <ChatAvatar
                              className="size-full object-cover"
                              key={config.avatarUrl ?? "fallback"}
                              url={config.avatarUrl}
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-lg border px-3 py-3 text-sm leading-6 [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${message.role === "assistant" && !message.content && state.isGenerating ? "border-0 bg-transparent" : message.failed ? "border-destructive/35 bg-destructive/10 text-destructive" : message.role === "user" ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-muted text-foreground"}`}
                          style={{
                            backgroundColor:
                              !message.failed && message.content
                                ? message.role === "user"
                                  ? (config.userMessageBackgroundColor ??
                                    undefined)
                                  : (config.assistantMessageBackgroundColor ??
                                    undefined)
                                : undefined,
                            color:
                              !message.failed && message.content
                                ? message.role === "user"
                                  ? config.userMessageBackgroundColor
                                    ? userForeground
                                    : undefined
                                  : config.assistantMessageBackgroundColor
                                    ? assistantForeground
                                    : undefined
                                : undefined,
                          }}
                        >
                          {message.content ? (
                            message.role === "assistant" ? (
                              <Markdown skipHtml>{message.content}</Markdown>
                            ) : (
                              message.content
                            )
                          ) : state.isGenerating ? (
                            <div
                              className="flex min-w-28 flex-col items-start gap-1"
                              aria-live="polite"
                              aria-label={loadingMessage}
                            >
                              <div
                                className="flex items-center gap-1"
                                aria-hidden="true"
                              >
                                <span className="size-1.5 animate-bounce rounded-full bg-current" />
                                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                              </div>
                              <span className="chat-shimmer text-[11px] text-muted-foreground">
                                {loadingMessage}
                              </span>
                            </div>
                          ) : (
                            message.stopped && (
                              <span className="text-xs text-muted-foreground">
                                Response stopped.
                              </span>
                            )
                          )}
                          {message.stopped &&
                            message.content &&
                            message.content !== "Response stopped." && (
                              <span className="mt-2 block text-xs text-muted-foreground">
                                Response stopped.
                              </span>
                            )}
                          {config.showMessageTimestamps &&
                            message.createdAt && (
                              <span className="mt-2 block text-xs opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString(
                                  undefined,
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                              </span>
                            )}
                        </div>
                      </div>
                    </MessageScroller.Item>
                  ))}
                </MessageScroller.Content>
              </MessageScroller.Viewport>
            </MessageScroller.Root>
          </MessageScroller.Provider>

          {state.starterQuestions.some(Boolean) && !state.isGenerating && (
            <div
              className="flex flex-wrap gap-2 border-t border-border bg-card px-3 py-2"
              style={{
                backgroundColor:
                  config.headerFooterBackgroundColor ?? undefined,
                color: config.headerFooterBackgroundColor
                  ? headerForeground
                  : undefined,
              }}
            >
              {state.starterQuestions.map((question, slot) => question ? (
                <Button
                  className="h-auto whitespace-normal text-left text-xs hover:text-inherit"
                  disabled={state.isGenerating}
                  key={`starter-question-${slot}`}
                  onClick={() => void handleStarterQuestion(question, slot)}
                  type="button"
                  variant="outline"
                  style={{
                    color: config.headerFooterBackgroundColor
                      ? headerForeground
                      : undefined,
                  }}
                >
                  {question}
                </Button>
              ) : null)}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-border bg-card p-3"
            onSubmit={handleSendMessage}
            style={{
              backgroundColor: config.headerFooterBackgroundColor ?? undefined,
              color: config.headerFooterBackgroundColor
                ? headerForeground
                : undefined,
            }}
          >
            <Input
              type="text"
              className="h-10 min-w-0 flex-1 rounded-md border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-current/50"
              placeholder={config.inputPlaceholder}
              aria-label="Your message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              style={{
                color: config.headerFooterBackgroundColor
                  ? headerForeground
                  : undefined,
              }}
            />
            <Button
              type={state.isGenerating ? "button" : "submit"}
              className="h-10 rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              disabled={!state.isGenerating && !input.trim()}
              onClick={state.isGenerating ? handleStopMessage : undefined}
              aria-label={
                state.isGenerating ? "Stop generating response" : "Send message"
              }
              style={{
                backgroundColor: actionBackground ?? undefined,
                color: actionBackground ? actionForeground : undefined,
                outlineColor: actionBackground ? actionForeground : undefined,
              }}
            >
              {state.isGenerating ? (
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <rect height="10" rx="1" width="10" x="3" y="3" />
                </svg>
              ) : (
                config.submitButtonText
              )}
            </Button>
          </form>
          <footer
            className="bg-card px-2 py-2 text-center text-[11px] text-muted-foreground opacity-75"
            style={{
              backgroundColor: config.headerFooterBackgroundColor ?? undefined,
              color: config.headerFooterBackgroundColor
                ? headerForeground
                : undefined,
            }}
          >
            Powered by your chatbot
          </footer>
        </section>
      )}

      {!isInline && (
        <Button
          type="button"
          className="size-14 rounded-full border-0 bg-primary text-2xl text-primary-foreground shadow-xl transition-all hover:-translate-y-px hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          size="icon"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
          aria-expanded={isOpen}
        >
          {isOpen ? "✕" : "💬"}
        </Button>
      )}
    </div>
  );
}
