ALTER TABLE "chat_conversation"
  ADD COLUMN "userMessageCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "chat_conversation" AS conversation
SET "userMessageCount" = counts."userMessageCount"
FROM (
  SELECT "conversationId", COUNT(*)::INTEGER AS "userMessageCount"
  FROM "chat_message"
  WHERE "role" = 'USER'
  GROUP BY "conversationId"
) AS counts
WHERE conversation."id" = counts."conversationId";

CREATE TABLE "chat_daily_usage" (
    "botId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "userMessageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_daily_usage_pkey" PRIMARY KEY ("botId", "day")
);

INSERT INTO "chat_daily_usage" ("botId", "day", "userMessageCount", "updatedAt")
SELECT deployment."botId",
       ((message."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::DATE,
       COUNT(*)::INTEGER,
       CURRENT_TIMESTAMP
FROM "chat_message" AS message
JOIN "chat_conversation" AS conversation
  ON conversation."id" = message."conversationId"
JOIN "bot_deployment" AS deployment
  ON deployment."id" = conversation."deploymentId"
WHERE message."role" = 'USER'
GROUP BY deployment."botId", ((message."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::DATE;

CREATE INDEX "chat_daily_usage_botId_idx" ON "chat_daily_usage"("botId");

ALTER TABLE "chat_daily_usage"
  ADD CONSTRAINT "chat_daily_usage_botId_fkey"
  FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
