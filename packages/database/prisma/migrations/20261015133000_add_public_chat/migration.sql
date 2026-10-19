-- CreateEnum
CREATE TYPE "BotDeploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "bot_deployment" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "status" "BotDeploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "allowedOrigins" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bot_deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversation" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "clientMessageId" TEXT,
    "role" "ChatMessageRole" NOT NULL,
    "status" "ChatMessageStatus" NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_citation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT,
    "chunkId" TEXT,
    "documentName" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_message_citation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_deployment_botId_key" ON "bot_deployment"("botId");
CREATE UNIQUE INDEX "bot_deployment_publicKey_key" ON "bot_deployment"("publicKey");
CREATE INDEX "chat_conversation_deploymentId_lastMessageAt_idx" ON "chat_conversation"("deploymentId", "lastMessageAt");
CREATE UNIQUE INDEX "chat_message_clientMessageId_key" ON "chat_message"("clientMessageId");
CREATE INDEX "chat_message_conversationId_createdAt_idx" ON "chat_message"("conversationId", "createdAt");
CREATE UNIQUE INDEX "chat_message_one_active_assistant_per_conversation"
  ON "chat_message"("conversationId")
  WHERE "role" = 'ASSISTANT' AND "status" IN ('PENDING', 'STREAMING');
CREATE INDEX "chat_message_citation_messageId_position_idx" ON "chat_message_citation"("messageId", "position");
CREATE INDEX "chat_message_citation_documentId_idx" ON "chat_message_citation"("documentId");
CREATE INDEX "chat_message_citation_chunkId_idx" ON "chat_message_citation"("chunkId");

-- AddForeignKey
ALTER TABLE "bot_deployment" ADD CONSTRAINT "bot_deployment_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "bot_deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_message_citation" ADD CONSTRAINT "chat_message_citation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_message_citation" ADD CONSTRAINT "chat_message_citation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_message_citation" ADD CONSTRAINT "chat_message_citation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "document_chunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
