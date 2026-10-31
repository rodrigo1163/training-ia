import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";

import { fetchChatConfig } from "../api/chat/fetch-chat-config";
import { sendMessage } from "../api/chat/send-message";
import { resolveChatConfig } from "../helpers/chat-config";
import { chatReducer, createInitialChatState } from "../helpers/chat-state";
import type { ChatWidgetProps } from "../types/chat";

const loadingMessages = [
  "Generating response...",
  "Analyzing your question...",
  "Checking the required information...",
  "Finalizing your response...",
] as const;

export function useChatWidget({
  deploymentKey,
  apiUrl,
  initiallyOpen = false,
  openDelay = 0,
  displayMode = "floating",
  mode = "public",
  chatConfig,
}: ChatWidgetProps) {
  const isInline = displayMode === "inline";
  const [isOpen, setIsOpen] = useState(isInline);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(() => resolveChatConfig(chatConfig));
  const [loadingMessage, setLoadingMessage] = useState<string>(
    loadingMessages[0],
  );
  const [state, dispatch] = useReducer(
    chatReducer,
    resolveChatConfig(chatConfig).initialMessage,
    createInitialChatState,
  );
  const requestRef = useRef<AbortController | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (chatConfig) return;

    let cancelled = false;
    void fetchChatConfig(apiUrl, deploymentKey)
      .then((remoteConfig) => {
        if (cancelled) return;
        const resolvedConfig = resolveChatConfig(remoteConfig);
        setConfig(resolvedConfig);
        dispatch({
          type: "set-initial-message",
          content: resolvedConfig.initialMessage,
        });
      })
      .catch(() => {
        // The defaults are deliberately kept when public configuration is
        // unavailable so the chat remains usable.
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, chatConfig, deploymentKey]);

  useEffect(() => {
    if (isInline || !initiallyOpen) return;

    const timeoutId = window.setTimeout(() => {
      if (!hasInteractedRef.current) setIsOpen(true);
    }, openDelay);

    return () => window.clearTimeout(timeoutId);
  }, [initiallyOpen, isInline, openDelay]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!state.isGenerating) return;

    const timeoutIds = loadingMessages.slice(1).map((message, index) =>
      window.setTimeout(
        () => {
          setLoadingMessage(message);
        },
        (index + 1) * 4000,
      ),
    );

    return () =>
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [state.isGenerating]);

  async function sendContent(content: string) {
    if (!content || state.isGenerating) return;

    const clientMessageId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const abortController = new AbortController();
    requestRef.current = abortController;
    setLoadingMessage(loadingMessages[0]);
    dispatch({ type: "start", userId: clientMessageId, assistantId, content });
    setInput("");

    try {
      for await (const streamEvent of sendMessage({
        apiUrl,
        deploymentKey,
        conversationId: state.conversationId,
        clientMessageId,
        content,
        context: {
          pageUrl: window.location.href.slice(0, 2000),
          pageTitle: document.title.slice(0, 200),
          locale: navigator.language.slice(0, 20),
        },
        signal: abortController.signal,
      })) {
        if (abortController.signal.aborted) break;
        dispatch({ type: "event", event: streamEvent });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        dispatch({
          type: "failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to get a response.",
        });
      }
    } finally {
      if (requestRef.current === abortController) {
        requestRef.current = null;
        if (abortController.signal.aborted) dispatch({ type: "stopped" });
      }
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendContent(input.trim());
  }

  function handleStopMessage() {
    requestRef.current?.abort();
  }

  function handleClearConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    setInput("");
    setLoadingMessage(loadingMessages[0]);
    dispatch({ type: "clear", initialMessage: config.initialMessage });
  }

  function handleSetIsOpen(next: boolean | ((previous: boolean) => boolean)) {
    hasInteractedRef.current = true;
    setIsOpen(next);
  }

  return {
    handleClearConversation,
    handleSendMessage,
    handleStarterQuestion: (question: string) => void sendContent(question),
    handleStopMessage,
    input,
    isInline,
    isOpen,
    loadingMessage,
    mode,
    config,
    setInput,
    setIsOpen: handleSetIsOpen,
    state,
  };
}
