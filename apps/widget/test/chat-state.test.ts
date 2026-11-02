import assert from "node:assert/strict";
import { test } from "node:test";
import { ChatRequestError, sendMessage } from "../src/api/chat/send-message.ts";
import { fetchChatConfig } from "../src/api/chat/fetch-chat-config.ts";
import { CHAT_LIMIT_ERROR_CODES } from "../src/helpers/chat-errors.ts";
import {
  canClearConversation,
  chatReducer,
  createInitialChatState,
} from "../src/helpers/chat-state.ts";
import {
  defaultChatConfig,
  resolveChatConfig,
} from "../src/helpers/chat-config.ts";
import type { SendMessageInput } from "../src/types/chat.ts";

const sendMessageInput: SendMessageInput = {
  apiUrl: "https://api.example.com",
  deploymentKey: "deployment-key",
  clientMessageId: "message-id",
  content: "hello",
  signal: new AbortController().signal,
};

test("uses the current visual defaults when style settings are absent", () => {
  const config = resolveChatConfig({});

  assert.equal(config.chatWidth, 424);
  assert.equal(config.chatHeight, 676);
  assert.equal(config.chatRadius, 12);
  assert.equal(config.messageRadius, 8);
  assert.equal(config.chatShadow, "2xl");
  assert.equal(config.floatingPosition, "bottom-right");
  assert.equal(config.footerBackgroundColor, null);
  assert.equal(config.inputBackgroundColor, null);
  assert.equal(config.inputTextColor, null);
  assert.equal(config.starterQuestionsTextColor, null);
  assert.equal(defaultChatConfig.chatWidth, 424);
});

async function getRequestError(response: Response) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => response) as typeof fetch;

  try {
    await sendMessage(sendMessageInput).next();
  } catch (error) {
    if (error instanceof ChatRequestError) return error;
    throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }

  throw new Error("Expected sendMessage to fail.");
}

function createGeneratingState() {
  return chatReducer(createInitialChatState("Welcome"), {
    type: "start",
    userId: "user-1",
    assistantId: "assistant-1",
    content: "Hello",
  });
}

test("preserves a daily limit code from an HTTP 429 response", async () => {
  const error = await getRequestError(
    new Response(
      JSON.stringify({
        code: CHAT_LIMIT_ERROR_CODES.daily,
        message: "server message",
      }),
      { status: 429 },
    ),
  );

  assert.equal(error.status, 429);
  assert.equal(error.code, CHAT_LIMIT_ERROR_CODES.daily);
  assert.equal(error.message, "server message");
});

test("preserves a conversation limit code from an HTTP 429 response", async () => {
  const error = await getRequestError(
    new Response(
      JSON.stringify({
        code: CHAT_LIMIT_ERROR_CODES.conversation,
        message: "server message",
      }),
      { status: 429 },
    ),
  );

  assert.equal(error.status, 429);
  assert.equal(error.code, CHAT_LIMIT_ERROR_CODES.conversation);
  assert.equal(error.message, "server message");
});

test("keeps the generic fallback when an error response is not JSON", async () => {
  const error = await getRequestError(
    new Response("not json", { status: 500 }),
  );

  assert.equal(error.status, 500);
  assert.equal(error.code, undefined);
  assert.equal(error.message, "Unable to send the message.");
});

test("keeps the API message without classifying an error that has no code", async () => {
  const error = await getRequestError(
    new Response(JSON.stringify({ message: "API message" }), { status: 429 }),
  );

  assert.equal(error.code, undefined);
  assert.equal(error.message, "API message");
});

test("keeps the API message without classifying an unknown error code", async () => {
  const error = await getRequestError(
    new Response(
      JSON.stringify({ code: "some_unknown_code", message: "API message" }),
      { status: 429 },
    ),
  );

  assert.equal(error.code, undefined);
  assert.equal(error.message, "API message");
});

test("uses widget-controlled messages for each known limit code", () => {
  const daily = chatReducer(createGeneratingState(), {
    type: "failed",
    code: CHAT_LIMIT_ERROR_CODES.daily,
    message: "Message from the server",
  });
  const conversation = chatReducer(createGeneratingState(), {
    type: "failed",
    code: CHAT_LIMIT_ERROR_CODES.conversation,
    message: "Message from the server",
  });

  assert.equal(
    daily.messages.at(-1)?.content,
    "Este bot atingiu o limite diário de mensagens. Tente novamente amanhã.",
  );
  assert.equal(
    conversation.messages.at(-1)?.content,
    "Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar.",
  );
  assert.equal(daily.errorCode, CHAT_LIMIT_ERROR_CODES.daily);
  assert.equal(conversation.errorCode, CHAT_LIMIT_ERROR_CODES.conversation);
});

test("clears the error code when starting a new attempt", () => {
  const failed = chatReducer(createGeneratingState(), {
    type: "failed",
    code: CHAT_LIMIT_ERROR_CODES.daily,
    message: "Message from the server",
  });
  const retrying = chatReducer(failed, {
    type: "start",
    userId: "user-2",
    assistantId: "assistant-2",
    content: "Retry",
  });

  assert.equal(retrying.errorCode, undefined);
});

test("clears the error code when clearing the conversation", () => {
  const failed = chatReducer(createGeneratingState(), {
    type: "failed",
    code: CHAT_LIMIT_ERROR_CODES.conversation,
    message: "Message from the server",
  });
  const cleared = chatReducer(failed, {
    type: "clear",
    initialMessage: "Welcome again",
    starterQuestions: [],
  });

  assert.equal(cleared.errorCode, undefined);
  assert.equal(cleared.messages[0]?.content, "Welcome again");
});

test("allows Clear for a conversation limit only in test mode", () => {
  assert.equal(
    canClearConversation("test", CHAT_LIMIT_ERROR_CODES.conversation),
    true,
  );
});

test("does not offer a local reset for a daily limit", () => {
  assert.equal(
    canClearConversation("test", CHAT_LIMIT_ERROR_CODES.daily),
    false,
  );
});

test("never offers Clear in public mode", () => {
  assert.equal(
    canClearConversation("public", CHAT_LIMIT_ERROR_CODES.conversation),
    false,
  );
});

test("keeps the fallback for an SSE error without a known code", () => {
  const failed = chatReducer(createGeneratingState(), {
    type: "event",
    event: {
      type: "error",
      data: { message: "Streaming API message" },
    },
  });

  assert.equal(failed.errorCode, undefined);
  assert.equal(failed.messages.at(-1)?.content, "Streaming API message");
});

test("uses the specific widget message for a known SSE limit code", () => {
  const failed = chatReducer(createGeneratingState(), {
    type: "event",
    event: {
      type: "error",
      data: {
        code: CHAT_LIMIT_ERROR_CODES.conversation,
        message: "Message from the server",
      },
    },
  });

  assert.equal(
    failed.messages.at(-1)?.content,
    "Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar.",
  );
  assert.equal(failed.errorCode, CHAT_LIMIT_ERROR_CODES.conversation);
});

test("replaces only the clicked starter question slot", () => {
  const initial = createInitialChatState("Welcome", [
    "First",
    "Second",
    "Third",
  ]);
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
