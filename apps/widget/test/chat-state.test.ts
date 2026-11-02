import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchChatConfig } from "../src/api/chat/fetch-chat-config.ts";
import { chatReducer, createInitialChatState } from "../src/helpers/chat-state.ts";

test("replaces only the clicked starter question slot", () => {
  const initial = createInitialChatState("Welcome", ["First", "Second", "Third"]);
  const generating = chatReducer(initial, {
    type: "start",
    userId: "user-1",
    assistantId: "assistant-1",
    content: "Second",
    starterQuestionSlot: 1,
  });

  assert.deepEqual(generating.starterQuestions, ["First", "", "Third"]);

  const replaced = chatReducer(generating, {
    type: "starter-question-generated",
    slot: 1,
    question: "Generated question?",
  });

  assert.deepEqual(replaced.starterQuestions, [
    "First",
    "Generated question?",
    "Third",
  ]);
});

test("keeps the clicked slot empty when the secondary generation fails", () => {
  const initial = createInitialChatState("Welcome", ["First", "Second"]);
  const generating = chatReducer(initial, {
    type: "start",
    userId: "user-1",
    assistantId: "assistant-1",
    content: "First",
    starterQuestionSlot: 0,
  });
  const failed = chatReducer(generating, {
    type: "event",
    event: {
      type: "completed",
      data: { model: "test-model" },
    },
  });

  assert.deepEqual(failed.starterQuestions, ["", "Second"]);
  assert.equal(failed.isGenerating, false);
});

test("free-form message start does not clear any starter question slot", () => {
  const initial = createInitialChatState("Welcome", ["First", "Second"]);
  const generating = chatReducer(initial, {
    type: "start",
    userId: "user-1",
    assistantId: "assistant-1",
    content: "A typed message",
  });

  assert.deepEqual(generating.starterQuestions, ["First", "Second"]);
});

test("includes the conversation id when refreshing public chat config", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestUrl = String(input);
    return new Response(JSON.stringify({ config: { starterQuestions: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await fetchChatConfig(
      "https://api.example.com/",
      "deployment/key",
      "conversation/1",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    requestUrl,
    "https://api.example.com/public/chat/deployment%2Fkey/config?conversationId=conversation%2F1",
  );
});

test("does not add a conversation query for a new conversation", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestUrl = String(input);
    return new Response(JSON.stringify({ config: { starterQuestions: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await fetchChatConfig("https://api.example.com", "deployment-key");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    requestUrl,
    "https://api.example.com/public/chat/deployment-key/config",
  );
});
