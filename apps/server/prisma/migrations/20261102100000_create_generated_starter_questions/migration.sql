CREATE TYPE "GeneratedStarterQuestionStatus" AS ENUM ('AVAILABLE', 'USED');

CREATE TABLE "bot_generated_starter_question" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "originalText" VARCHAR(120) NOT NULL,
    "normalizedText" VARCHAR(120) NOT NULL,
    "status" "GeneratedStarterQuestionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_generated_starter_question_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bot_generated_starter_question_botId_normalizedText_key"
  ON "bot_generated_starter_question"("botId", "normalizedText");

CREATE INDEX "bot_generated_starter_question_botId_createdAt_idx"
  ON "bot_generated_starter_question"("botId", "createdAt");

ALTER TABLE "bot_generated_starter_question"
  ADD CONSTRAINT "bot_generated_starter_question_botId_fkey"
  FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
