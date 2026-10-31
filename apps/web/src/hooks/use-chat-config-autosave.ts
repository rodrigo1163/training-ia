import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { editChatConfig } from "@/api/bots/edit-chat-config";
import type { Bot, ChatConfig, ChatConfigPatch } from "@/api/bots/types";
import { botQueryKey } from "@/hooks/use-bots";

export const CHAT_CONFIG_AUTOSAVE_DEBOUNCE_MS = 700;

export type ChatConfigSaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "error";

type PendingEntry = {
  value: ChatConfig[keyof ChatConfig];
  version: number;
};

const chatConfigKeys = Object.keys({
  avatarUrl: null,
  inputPlaceholder: null,
  submitButtonText: null,
  showMessageTimestamps: false,
  starterQuestions: [],
  generateStarterQuestionsAfterResponse: false,
  initialMessage: null,
  headerStatusText: null,
  chatBackgroundColor: null,
  headerFooterBackgroundColor: null,
  assistantMessageBackgroundColor: null,
  userMessageBackgroundColor: null,
  model: null,
  temperature: null,
  maxTokens: null,
  maxMessagesPerDay: null,
  maxUserMessagesPerConversation: null,
}) as Array<keyof ChatConfig>;

function isEqual(
  first: ChatConfig[keyof ChatConfig],
  second: ChatConfig[keyof ChatConfig],
) {
  if (Array.isArray(first) && Array.isArray(second)) {
    return (
      first.length === second.length &&
      first.every((value, index) => value === second[index])
    );
  }

  return first === second;
}

export function useChatConfigAutosave(
  orgSlug: string,
  botSlug: string,
  initialConfig: ChatConfig,
) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ChatConfig>(initialConfig);
  const [status, setStatus] = useState<ChatConfigSaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const localConfigRef = useRef(initialConfig);
  const savedConfigRef = useRef(initialConfig);
  const pendingRef = useRef<Partial<Record<keyof ChatConfig, PendingEntry>>>({});
  const fieldVersionsRef = useRef<Partial<Record<keyof ChatConfig, number>>>({});
  const versionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const sendingRef = useRef(false);
  const inFlightRef = useRef<Partial<Record<keyof ChatConfig, PendingEntry>>>({});
  const mountedRef = useRef(true);

  function updateQueryCache(nextConfig: ChatConfig) {
    queryClient.setQueryData<Bot>(botQueryKey(orgSlug, botSlug), (bot) =>
      bot ? { ...bot, chatConfig: nextConfig } : bot,
    );
  }

  function scheduleFlush(delay = CHAT_CONFIG_AUTOSAVE_DEBOUNCE_MS) {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void flush();
    }, delay);
  }

  async function flush() {
    if (sendingRef.current || Object.keys(pendingRef.current).length === 0) {
      return;
    }

    const entries = pendingRef.current;
    pendingRef.current = {};
    inFlightRef.current = entries;
    sendingRef.current = true;
    if (mountedRef.current) setStatus("saving");

    const patch = Object.fromEntries(
      Object.entries(entries).map(([key, entry]) => [key, entry.value]),
    ) as ChatConfigPatch;
    let requestFailed = false;

    try {
      const updatedBot = await editChatConfig(orgSlug, botSlug, patch);
      const nextConfig = { ...localConfigRef.current };

      for (const key of chatConfigKeys) {
        const entry = entries[key];
        if (!entry || fieldVersionsRef.current[key] !== entry.version) {
          continue;
        }

        Object.assign(nextConfig, { [key]: updatedBot.chatConfig[key] });
        Object.assign(savedConfigRef.current, {
          [key]: updatedBot.chatConfig[key],
        });
      }

      localConfigRef.current = nextConfig;
      if (mountedRef.current) {
        setConfig(nextConfig);
        setError(null);
        updateQueryCache(nextConfig);
      }
    } catch (caught) {
      requestFailed = true;
      for (const key of chatConfigKeys) {
        const entry = entries[key];
        if (
          entry &&
          fieldVersionsRef.current[key] === entry.version &&
          pendingRef.current[key] === undefined
        ) {
          pendingRef.current[key] = entry;
        }
      }

      if (mountedRef.current) {
        setError(caught instanceof Error ? caught : new Error("Unable to save the chat settings."));
        setStatus("error");
      }
    } finally {
      sendingRef.current = false;
      inFlightRef.current = {};
      if (Object.keys(pendingRef.current).length > 0) {
        scheduleFlush(0);
      } else if (mountedRef.current && !requestFailed) {
        setStatus("saved");
      }
    }
  }

  function update(patch: ChatConfigPatch) {
    const nextConfig = { ...localConfigRef.current, ...patch };
    const nextPending = { ...pendingRef.current };
    const version = versionRef.current + 1;
    versionRef.current = version;

    for (const key of chatConfigKeys) {
      if (!(key in patch)) continue;

      const value = nextConfig[key];
      const inFlightEntry = inFlightRef.current[key];
      if (
        isEqual(value, savedConfigRef.current[key]) &&
        (!inFlightEntry || isEqual(value, inFlightEntry.value))
      ) {
        delete nextPending[key];
      } else {
        nextPending[key] = { value, version };
      }
      fieldVersionsRef.current[key] = version;
    }

    pendingRef.current = nextPending;
    localConfigRef.current = nextConfig;
    setConfig(nextConfig);
    updateQueryCache(nextConfig);
    setError(null);
    setStatus(Object.keys(nextPending).length > 0 ? "pending" : "idle");

    if (Object.keys(nextPending).length > 0) scheduleFlush();
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { config, error, status, update };
}
