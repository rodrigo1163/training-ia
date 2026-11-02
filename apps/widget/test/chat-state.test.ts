import assert from "node:assert/strict";
import { test } from "node:test";
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
