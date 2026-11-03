import { MessageScroller } from "@shadcn/react/message-scroller";
import Markdown from "react-markdown";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@training-ia/ui/components/ui/button";
import { Input } from "@training-ia/ui/components/ui/input";
import { useChatWidget } from "../hooks/use-chat-widget";
import { getReadableForeground } from "@training-ia/ui/helpers/chat-colors";
import { canClearConversation } from "../helpers/chat-state";
import type { ChatTheme, ChatWidgetProps } from "../types/chat";

const chatShadowValues: Record<
  Exclude<
    NonNullable<ChatWidgetProps["chatConfig"]>["style"]["chatShadow"],
    null
  >,
  string
> = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

function ChatAvatar({
  className,
  fallback = "🤖",
  url,
}: {
  className?: string;
  fallback?: ReactNode;
  url: string | null;
}) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) return fallback;

  return (
    <img
      alt=""
      className={className}
      onError={() => setHasError(true)}
      src={url}
    />
  );
}

type LauncherIconName = "chat" | "bot" | "sparkles";

function LauncherGlyph({ icon }: { icon: LauncherIconName }) {
  if (icon === "bot") {
    return (
      <svg
        aria-hidden="true"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v3m-3 0h6" />
        <rect height="13" rx="4" width="18" x="3" y="8" />
        <path d="M8 13h.01M16 13h.01M9 17h6" />
      </svg>
    );
  }

  if (icon === "sparkles") {
    return (
      <svg
        aria-hidden="true"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </svg>
  );
}

function ChatLauncherIcon({
  avatarUrl,
  icon,
}: {
  avatarUrl: string | null;
  icon: "chat" | "bot" | "sparkles" | "avatar";
}) {
  if (icon === "avatar") {
    return (
      <ChatAvatar
        className="size-full object-cover"
        fallback={<LauncherGlyph icon="chat" />}
        key={avatarUrl ?? "missing-avatar"}
        url={avatarUrl}
      />
    );
  }

  return <LauncherGlyph icon={icon} />;
}

const chatFontFamilyValues = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
} as const;

const chatMessageFontSizeValues = {
  sm: "13px",
  md: "14px",
  lg: "16px",
} as const;

const chatMessageTimestampFontSizeValues = {
  sm: "11px",
  md: "12px",
  lg: "14px",
} as const;

const launcherSizeLimits = { min: 48, max: 72 } as const;

function clampLauncherSize(size: number) {
  if (!Number.isFinite(size)) return 56;

  return Math.min(
    launcherSizeLimits.max,
    Math.max(launcherSizeLimits.min, size),
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
  const { onFloatingPositionChange } = props;
  const [systemTheme, setSystemTheme] = useState<ChatTheme>(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    if (
      mode === "test" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "dark" : "light");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [mode]);

  const activeTheme =
    mode === "test" ? (props.previewTheme ?? "light") : systemTheme;
  const style = config.style;
  const colors = style.colors[activeTheme];
  const chatForeground = getReadableForeground(colors.chatBackgroundColor);
  const headerForeground = getReadableForeground(
    colors.headerFooterBackgroundColor,
    "#ffffff",
  );
  const footerBackground =
    colors.footerBackgroundColor ?? colors.headerFooterBackgroundColor;
  const footerForeground = getReadableForeground(
    footerBackground,
    headerForeground,
    colors.chatBackgroundColor ?? "#ffffff",
  );
  const inputForeground = getReadableForeground(
    colors.inputBackgroundColor,
    headerForeground,
    footerBackground ?? "#ffffff",
  );
  const suggestionsForeground =
    colors.starterQuestionsTextColor ?? chatForeground;
  const assistantForeground =
    colors.assistantMessageTextColor ??
    getReadableForeground(colors.assistantMessageBackgroundColor);
  const userForeground =
    colors.userMessageTextColor ??
    getReadableForeground(colors.userMessageBackgroundColor, "#ffffff");
  const actionBackground =
    colors.userMessageBackgroundColor ?? colors.headerFooterBackgroundColor;
  const actionForeground = getReadableForeground(actionBackground, "#ffffff");
  const launcherForeground = getReadableForeground(
    colors.launcherBackgroundColor,
    "#ffffff",
  );
  const launcherSize = clampLauncherSize(style.launcherSize);
  const messageFontSize = chatMessageFontSizeValues[style.chatMessageFontSize];
  const messageLineHeight = style.chatMessageFontSize === "md" ? "24px" : "1.5";
  const panelShadow = chatShadowValues[style.chatShadow];
  const borderColor =
    colors.chatBorderColor ?? (activeTheme === "light" ? "#e3eaf3" : "#d1d5db");
  const border =
    style.chatBorderWidth > 0
      ? `${style.chatBorderWidth}px solid ${borderColor}`
      : undefined;
  const panelStyle = {
    boxSizing: "border-box" as const,
    backgroundColor: colors.chatBackgroundColor ?? undefined,
    color: colors.chatBackgroundColor ? chatForeground : undefined,
    width: `${style.chatWidth}px`,
    maxWidth: "100%",
    height: isInline
      ? `min(${style.chatHeight}px, calc(100dvh - 12rem))`
      : `${style.chatHeight}px`,
    minHeight: isInline ? "360px" : undefined,
    borderRadius: `${style.chatRadius}px`,
    boxShadow: panelShadow,
    border,
    fontFamily: chatFontFamilyValues[style.chatFontFamily],
  };

  useEffect(() => {
    if (!isInline) onFloatingPositionChange?.(style.floatingPosition);
  }, [style.floatingPosition, isInline, onFloatingPositionChange]);

  return (
    <div
      className={`${activeTheme === "dark" ? "dark " : ""}${
        isInline
          ? "flex w-full justify-center font-sans"
          : `flex flex-col font-sans ${
              style.floatingPosition === "bottom-left"
                ? "items-start"
                : "items-end"
            }`
      }`}
    >
      {isOpen && (
        <section
          className={`${isInline ? "" : "mb-4"} flex flex-col overflow-hidden bg-card`}
          style={panelStyle}
        >
          <header
            className="flex items-center gap-3 bg-primary px-4 py-3.5 text-primary-foreground"
            style={{
              backgroundColor: colors.headerFooterBackgroundColor ?? undefined,
              color: colors.headerFooterBackgroundColor
                ? headerForeground
                : undefined,
            }}
          >
            <div className="grid size-9 place-items-center rounded-full bg-primary-foreground/15 text-lg">
              <ChatAvatar
                className="size-full rounded-full object-cover"
                key={style.avatarUrl ?? "fallback"}
                url={style.avatarUrl}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <strong className="text-sm font-semibold">
                {config.assistantName}
              </strong>
              {config.headerStatusText && (
                <span className="text-xs opacity-70">
                  {config.headerStatusText}
                </span>
              )}
            </div>
            {canClearConversation(mode, state.errorCode) && (
              <Button
                type="button"
                className="rounded-md text-primary-foreground hover:bg-black/10 hover:text-inherit focus-visible:ring-[3px] focus-visible:ring-current/50"
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                disabled={state.messages.length <= 1 && !state.isGenerating}
                style={{
                  color: colors.headerFooterBackgroundColor
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
                  color: colors.headerFooterBackgroundColor
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
                              key={style.avatarUrl ?? "fallback"}
                              url={style.avatarUrl}
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] border px-3 py-3 text-sm leading-6 [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-[1.15em] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-[1em] [&_h2]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${message.role === "assistant" && !message.content && state.isGenerating ? "border-0 bg-transparent" : message.failed ? "border-destructive/35 bg-destructive/10 text-destructive" : message.role === "user" ? "border-transparent bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                          style={{
                            borderRadius: `${style.messageRadius}px`,
                            borderColor:
                              message.role === "assistant" && !message.failed
                                ? borderColor
                                : undefined,
                            fontSize: messageFontSize,
                            lineHeight: messageLineHeight,
                            backgroundColor:
                              !message.failed && message.content
                                ? message.role === "user"
                                  ? (colors.userMessageBackgroundColor ??
                                    undefined)
                                  : (colors.assistantMessageBackgroundColor ??
                                    undefined)
                                : undefined,
                            color:
                              !message.failed && message.content
                                ? message.role === "user"
                                  ? (colors.userMessageTextColor ??
                                    (colors.userMessageBackgroundColor
                                      ? userForeground
                                      : undefined))
                                  : (colors.assistantMessageTextColor ??
                                    (colors.assistantMessageBackgroundColor
                                      ? assistantForeground
                                      : undefined))
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
                              <span
                                className="mt-2 block opacity-70"
                                style={{
                                  fontSize:
                                    chatMessageTimestampFontSizeValues[
                                      style.chatMessageFontSize
                                    ],
                                }}
                              >
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
              className="flex flex-wrap gap-2 border-t px-3 py-2"
              style={{
                backgroundColor: "transparent",
                borderColor,
                color: suggestionsForeground,
              }}
            >
              {state.starterQuestions.map((question, slot) =>
                question ? (
                  <Button
                    className="h-auto whitespace-normal text-left text-xs hover:text-inherit"
                    disabled={state.isGenerating}
                    key={`starter-question-${slot}`}
                    onClick={() => void handleStarterQuestion(question, slot)}
                    type="button"
                    variant="outline"
                    style={{
                      backgroundColor: "transparent",
                      borderColor,
                      color: suggestionsForeground,
                    }}
                  >
                    {question}
                  </Button>
                ) : null,
              )}
            </div>
          )}

          <form
            className="flex gap-2 border-t bg-card p-3"
            onSubmit={handleSendMessage}
            style={{
              backgroundColor: footerBackground ?? undefined,
              borderColor,
              color: footerBackground ? footerForeground : undefined,
            }}
          >
            <Input
              type="text"
              className="h-10 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm selection:bg-current/20 selection:text-inherit placeholder:text-inherit focus-visible:ring-[3px] focus-visible:ring-current/50"
              placeholder={config.inputPlaceholder}
              aria-label="Your message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              style={{
                backgroundColor:
                  colors.inputBackgroundColor ??
                  (activeTheme === "dark" ? "#111827" : "#ffffff"),
                borderColor,
                color: colors.inputTextColor ?? inputForeground,
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
            className="bg-card px-2 py-2 text-center text-[11px] text-muted-foreground"
            style={{
              backgroundColor: footerBackground ?? undefined,
              color: footerBackground ? footerForeground : undefined,
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
          style={{
            width: `${launcherSize}px`,
            height: `${launcherSize}px`,
            backgroundColor: colors.launcherBackgroundColor ?? undefined,
            color: colors.launcherBackgroundColor
              ? launcherForeground
              : undefined,
          }}
        >
          {isOpen ? (
            "✕"
          ) : (
            <ChatLauncherIcon
              avatarUrl={style.avatarUrl}
              icon={style.launcherIcon}
            />
          )}
        </Button>
      )}
    </div>
  );
}
