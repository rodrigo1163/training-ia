import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { afterAll, beforeAll } from 'vitest';
import { PrismaClient } from 'prisma/generated/prisma/client.js';
import { DomainEvents } from '@/core/events/domain-events';

config({ path: '.env', override: true });
config({ path: '.env.test', override: true });

process.env.RABBITMQ_URL ??= 'amqp://docker:docker@localhost:5672';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.OPENROUTER_API_KEY ??= 'test-openrouter-key';
process.env.OPENROUTER_CHAT_MODEL ??= 'test/chat-model';

function generateUniqueDatabaseURL(schemaId: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provider a DATABASE_URL environment variable.');
  }

  const url = new URL(process.env.DATABASE_URL);

  url.searchParams.set('schema', schemaId);

  return url.toString();
}

const schemaId = randomUUID();
const databaseURL = generateUniqueDatabaseURL(schemaId);

process.env.DATABASE_URL = databaseURL;

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: databaseURL },
    { schema: schemaId },
  ),
});

beforeAll(async () => {
  DomainEvents.shouldRun = false;

  execSync('pnpm prisma migrate deploy');
});

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
  await prisma.$disconnect();
});
