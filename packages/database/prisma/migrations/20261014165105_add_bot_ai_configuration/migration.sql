-- CreateEnum
CREATE TYPE "BotPersonality" AS ENUM ('NEUTRAL', 'PROFESSIONAL', 'FRIENDLY', 'CONCISE', 'DETAILED', 'EMPATHETIC', 'PLAYFUL', 'TECHNICAL', 'EDUCATIONAL');

-- AlterTable
ALTER TABLE "bot" ADD COLUMN     "description" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN     "personality" "BotPersonality" NOT NULL DEFAULT 'NEUTRAL',
ADD COLUMN     "systemMessage" TEXT;
