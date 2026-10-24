import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";

import { sendMessage } from "../api/chat/send-message";
import { chatReducer, initialChatState } from "../helpers/chat-state";
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
}: ChatWidgetProps) {
  const isInline = displayMode === "inline";
  const [isOpen, setIsOpen] = useState(isInline);
  const [input, setInput] = useState("");
  const [loadingMessage, setLoadingMessage] = useState<string>(
    loadingMessages[0],
  );
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const requestRef = useRef<AbortController | null>(null);
  const hasInteractedRef = useRef(false);

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

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
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

  function handleStopMessage() {
    requestRef.current?.abort();
  }

  function handleSetIsOpen(next: boolean | ((previous: boolean) => boolean)) {
    hasInteractedRef.current = true;
    setIsOpen(next);
  }

  return {
    handleSendMessage,
    handleStopMessage,
    input,
    isInline,
    isOpen,
    loadingMessage,
    setInput,
    setIsOpen: handleSetIsOpen,
    state,
  };
}
