import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";

import { fetchChatConfig } from "../api/chat/fetch-chat-config";
import { generateStarterQuestion } from "../api/chat/generate-starter-question";
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
  const [remoteConfig, setRemoteConfig] = useState(() =>
    resolveChatConfig(chatConfig),
  );
  const config = chatConfig ? resolveChatConfig(chatConfig) : remoteConfig;
  const initialConfig = resolveChatConfig(chatConfig);
  const [loadingMessage, setLoadingMessage] = useState<string>(
    loadingMessages[0],
  );
  const [state, dispatch] = useReducer(
    chatReducer,
    initialConfig,
    (value) =>
      createInitialChatState(value.initialMessage, value.starterQuestions),
  );
  const requestRef = useRef<AbortController | null>(null);
  const starterRequestRef = useRef<AbortController | null>(null);
  const starterGenerationIdRef = useRef(0);
  const hasInteractedRef = useRef(false);

  function applyRemoteConfig(nextConfig: Awaited<ReturnType<typeof fetchChatConfig>>) {
    const resolvedConfig = resolveChatConfig(nextConfig);
    setRemoteConfig(resolvedConfig);
    dispatch({
      type: "set-initial-message",
      content: resolvedConfig.initialMessage,
    });
    dispatch({
      type: "set-starter-questions",
      starterQuestions: resolvedConfig.starterQuestions,
    });
  }

  useEffect(() => {
    if (chatConfig) {
      dispatch({
        type: "set-initial-message",
        content: resolveChatConfig(chatConfig).initialMessage,
      });
      dispatch({
        type: "set-starter-questions",
        starterQuestions: resolveChatConfig(chatConfig).starterQuestions,
      });
      return;
    }

    let cancelled = false;
    void fetchChatConfig(apiUrl, deploymentKey)
      .then((remoteConfig) => {
        if (cancelled) return;
        applyRemoteConfig(remoteConfig);
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

  useEffect(
    () => () => {
      requestRef.current?.abort();
      starterRequestRef.current?.abort();
    },
    [],
  );

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

  async function generateNextStarterQuestion(input: {
    conversationId: string;
    userMessageId: string;
    slot: number;
    clickedQuestion: string;
    primarySignal: AbortSignal;
    generationId: number;
  }) {
    const controller = new AbortController();
    const abortSecondary = () => controller.abort();
    input.primarySignal.addEventListener("abort", abortSecondary, {
      once: true,
    });
    starterRequestRef.current = controller;

    try {
      const result = await generateStarterQuestion({
        apiUrl,
        deploymentKey,
        conversationId: input.conversationId,
        userMessageId: input.userMessageId,
        slot: input.slot,
        clickedQuestion: input.clickedQuestion,
        signal: controller.signal,
      });

      if (
        result.question &&
        input.generationId === starterGenerationIdRef.current
      ) {
        dispatch({
          type: "starter-question-generated",
          slot: input.slot,
          question: result.question,
        });
      }
    } catch {
      // A secondary failure must not affect the primary conversation stream.
    } finally {
      input.primarySignal.removeEventListener("abort", abortSecondary);
      if (starterRequestRef.current === controller) {
        starterRequestRef.current = null;
      }
    }
  }

  async function sendContent(
    content: string,
    starterQuestion?: { slot: number; question: string },
  ) {
    if (!content || state.isGenerating) return;

    const clientMessageId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const abortController = new AbortController();
    const generationId = ++starterGenerationIdRef.current;
    requestRef.current = abortController;
    setLoadingMessage(loadingMessages[0]);
    dispatch({
      type: "start",
      userId: clientMessageId,
      assistantId,
      content,
      starterQuestionSlot: starterQuestion?.slot,
    });
    setInput("");
    let secondaryRequestStarted = false;

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
        displayedStarterQuestions: state.starterQuestions.filter(Boolean),
        signal: abortController.signal,
      })) {
        if (abortController.signal.aborted) break;
        if (
          streamEvent.type === "metadata" &&
          starterQuestion &&
          !secondaryRequestStarted
        ) {
          secondaryRequestStarted = true;
          void generateNextStarterQuestion({
            conversationId: streamEvent.data.conversationId,
            userMessageId: streamEvent.data.userMessageId,
            slot: starterQuestion.slot,
            clickedQuestion: starterQuestion.question,
            primarySignal: abortController.signal,
            generationId,
          });
        }
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
    starterRequestRef.current?.abort();
    starterGenerationIdRef.current += 1;
    requestRef.current = null;
    starterRequestRef.current = null;
    setInput("");
    setLoadingMessage(loadingMessages[0]);
    dispatch({
      type: "clear",
      initialMessage: config.initialMessage,
      starterQuestions: config.starterQuestions,
    });

    if (chatConfig) return;

    void fetchChatConfig(apiUrl, deploymentKey)
      .then((remoteConfig) => {
        applyRemoteConfig(remoteConfig);
      })
      .catch(() => {
        // Keep the previous configuration when a refresh fails.
      });
  }

  function handleSetIsOpen(next: boolean | ((previous: boolean) => boolean)) {
    hasInteractedRef.current = true;
    setIsOpen(next);
  }

  return {
    handleClearConversation,
    handleSendMessage,
    handleStarterQuestion: (question: string, slot: number) =>
      void sendContent(
        question,
        config.generateStarterQuestionsAfterResponse
          ? { question, slot }
          : undefined,
      ),
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
