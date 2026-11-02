ALTER TABLE "bot_generated_starter_question"
ADD COLUMN "idempotencyKey" VARCHAR(64);

UPDATE "bot_generated_starter_question"
SET "idempotencyKey" = 'legacy:' || "id"
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "bot_generated_starter_question"
ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "bot_generated_starter_question_botId_idempotencyKey_key"
  ON "bot_generated_starter_question"("botId", "idempotencyKey");

CREATE TABLE "bot_generated_starter_question_usage" (
    "id" TEXT NOT NULL,
    "generatedStarterQuestionId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickedAt" TIMESTAMP(3),

    CONSTRAINT "bot_generated_starter_question_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bot_generated_starter_question_usage_generatedStarterQuestionId_conversationId_key"
  ON "bot_generated_starter_question_usage"("generatedStarterQuestionId", "conversationId");

CREATE INDEX "bot_generated_starter_question_usage_conversationId_shownAt_idx"
  ON "bot_generated_starter_question_usage"("conversationId", "shownAt");

ALTER TABLE "bot_generated_starter_question_usage"
  ADD CONSTRAINT "bot_generated_starter_question_usage_generatedStarterQuestionId_fkey"
  FOREIGN KEY ("generatedStarterQuestionId") REFERENCES "bot_generated_starter_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bot_generated_starter_question_usage"
  ADD CONSTRAINT "bot_generated_starter_question_usage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "chat_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
