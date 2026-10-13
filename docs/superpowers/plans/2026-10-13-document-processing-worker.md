# Document Processing Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish newly uploaded PDF document IDs to RabbitMQ and process their stored text into pgvector embeddings in the background worker.

**Architecture:** The server publishes a durable `DocumentProcessingMessage` after the upload transaction succeeds. A single Nest provider in the worker consumes one message at a time, splits text with LangChain, embeds batches through OpenRouter, persists chunks and vectors transactionally with `pg`, and updates the document status.

**Tech Stack:** TypeScript, NestJS, amqplib, RabbitMQ, LangChain.js, OpenRouter, PostgreSQL, pgvector, Vitest, pnpm

**Spec:** `docs/superpowers/specs/2026-10-13-document-processing-worker-design.md`

## Global Constraints

- Use `pnpm`; do not use npm or yarn.
- Preserve strict TypeScript and do not introduce `any`.
- Queue name is exactly `document.processing`; queue is durable and messages are persistent.
- Queue payload is exactly `{ documentId: string }`.
- Worker uses `prefetch(1)` and acknowledges every delivered message; it never requeues in this version.
- Embedding model is exactly `openai/text-embedding-3-small` with `1536` dimensions.
- Splitter settings are exactly `chunkSize: 1000` and `chunkOverlap: 200`.
- Embedding batch size is at most `50`.
- `tokenCount`, `pageStart`, and `pageEnd` remain `NULL`.
- Worker uses the existing `pg` pool, not Prisma.
- Do not add Nest Microservices, retries, dead-letter queues, an outbox, vector search, or an HNSW index.
- Do not log PDF text or `OPENROUTER_API_KEY`.

## Review Focus

- Malformed JSON or payloads with missing/extra fields must be acknowledged without database or OpenRouter calls; Task 2 pins this behavior.
- OpenRouter returning the wrong number of vectors, a non-finite number, or a vector other than 1536 dimensions must mark the document `FAILED`; Task 2 pins this behavior.
- A database failure after chunk deletion must roll back all chunk changes, then mark the document `FAILED`; Task 2 pins this behavior.
- Duplicate messages for `READY` or `FAILED` documents must be acknowledged without generating embeddings; Task 2 pins this behavior.
- RabbitMQ publisher confirmation failure must make the upload endpoint fail while leaving the already-persisted document `PROCESSING`; Task 1 pins this behavior.

---

### Task 1: Publish uploaded documents to RabbitMQ

**Files:**
- Create: `apps/server/src/infra/messaging/document-processing-publisher.ts`
- Create: `apps/server/src/infra/messaging/document-processing-publisher.spec.ts`
- Modify: `apps/server/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/server/src/infra/env/env.ts`
- Modify: `apps/server/src/infra/app.module.ts`
- Modify: `apps/server/src/infra/http/controllers/upload-pdf-bot.controller.ts`
- Modify: `apps/server/src/infra/http/controllers/upload-pdf-bot.controller.e2e-spec.ts`
- Modify: `apps/server/test/setup-e2e.ts`

**Interfaces:**
- Consumes: `EnvService.get('RABBITMQ_URL'): string` and the successful `UploadBotPdfUseCase` result.
- Produces: `DocumentProcessingMessage { documentId: string }` and `DocumentProcessingPublisher.publish(message: DocumentProcessingMessage): Promise<void>` on durable queue `document.processing`.

- [ ] **Step 1: Add the RabbitMQ client dependencies to the server**

Run:

```bash
pnpm --filter server add amqplib
pnpm --filter server add -D @types/amqplib
```

Expected: `apps/server/package.json` and `pnpm-lock.yaml` include the packages; no npm or yarn lockfile is created.

- [ ] **Step 2: Write the failing publisher unit tests**

Create `document-processing-publisher.spec.ts` with mocked `amqplib` and these tests:

```ts
it('connects and asserts the durable document processing queue')
it('publishes a persistent JSON message and waits for broker confirmation')
it('propagates a broker confirmation failure')
it('closes the channel and connection on application shutdown')
```

Assert the exact queue `document.processing`, UTF-8 JSON `{ "documentId": "document-1" }`, options `{ persistent: true, contentType: 'application/json' }`, and `waitForConfirms()`.

- [ ] **Step 3: Run the publisher tests to verify RED**

Run: `pnpm --filter server exec vitest run src/infra/messaging/document-processing-publisher.spec.ts`

Expected: FAIL because `DocumentProcessingPublisher` does not exist.

- [ ] **Step 4: Implement the publisher provider**

Create these exact exports in `document-processing-publisher.ts`:

```ts
export const DOCUMENT_PROCESSING_QUEUE = 'document.processing';

export interface DocumentProcessingMessage {
  documentId: string;
}

@Injectable()
export class DocumentProcessingPublisher
  implements OnModuleInit, OnApplicationShutdown {
  onModuleInit(): Promise<void>;
  publish(message: DocumentProcessingMessage): Promise<void>;
  onApplicationShutdown(): Promise<void>;
}
```

Use `amqplib.connect`, `createConfirmChannel`, `assertQueue(..., { durable: true })`, `sendToQueue`, and `waitForConfirms`. Throw if `publish` is called before initialization.

- [ ] **Step 5: Run the publisher tests to verify GREEN**

Run: `pnpm --filter server exec vitest run src/infra/messaging/document-processing-publisher.spec.ts`

Expected: PASS, 4 tests.

- [ ] **Step 6: Write failing upload E2E assertions for publication**

In `upload-pdf-bot.controller.e2e-spec.ts`, override `DocumentProcessingPublisher` with `{ publish: vi.fn() }` before compiling the testing module.

Extend the successful upload test to assert:

```ts
expect(publisher.publish).toHaveBeenCalledWith({
  documentId: upload.documentId,
});
```

Add `it('returns an error and leaves the document processing when publication fails')`: reject the fake publisher once, perform a valid upload, expect HTTP `500`, then query the created document by its unique uploaded filename and assert `status === 'PROCESSING'`.

Set `process.env.RABBITMQ_URL ??= 'amqp://docker:docker@localhost:5672'` in `test/setup-e2e.ts` after loading test env files.

- [ ] **Step 7: Run the upload E2E test to verify RED**

Run: `pnpm --filter server exec vitest run --config ./vitest.config.e2e.ts src/infra/http/controllers/upload-pdf-bot.controller.e2e-spec.ts`

Expected: FAIL because the controller does not publish and the provider is not registered.

- [ ] **Step 8: Wire publication into the upload endpoint**

Make these focused changes:

- add required `RABBITMQ_URL: z.string().url().startsWith('amqp://')` to `envSchema`;
- register `DocumentProcessingPublisher` in `AppModule.providers`;
- inject it into `UploadPdfBotController`;
- after a right result, call `await publisher.publish({ documentId })` before returning `{ documentId }`.

Do not move PDF processing into the controller and do not catch publication errors.

- [ ] **Step 9: Run server tests and type checking**

Run: `pnpm --filter server exec vitest run src/infra/messaging/document-processing-publisher.spec.ts`

Expected: PASS, 4 tests.

Run: `pnpm --filter server exec vitest run --config ./vitest.config.e2e.ts src/infra/http/controllers/upload-pdf-bot.controller.e2e-spec.ts`

Expected: PASS, including successful publication and publication failure coverage.

Run: `pnpm --filter server check-types`

Expected: exit code 0.

- [ ] **Step 10: Commit the server publisher**

```bash
git add apps/server/package.json pnpm-lock.yaml apps/server/src/infra/env/env.ts apps/server/src/infra/app.module.ts apps/server/src/infra/messaging/document-processing-publisher.ts apps/server/src/infra/messaging/document-processing-publisher.spec.ts apps/server/src/infra/http/controllers/upload-pdf-bot.controller.ts apps/server/src/infra/http/controllers/upload-pdf-bot.controller.e2e-spec.ts apps/server/test/setup-e2e.ts
git commit -m "feat(server): publish document processing jobs"
```

### Task 2: Consume document jobs and persist embeddings

**Files:**
- Create: `apps/worker/src/jobs/process-document.consumer.ts`
- Create: `apps/worker/src/jobs/process-document.consumer.spec.ts`
- Create: `apps/worker/vitest.config.ts`
- Create: `apps/server/prisma/migrations/20261013180000_constrain_embedding_dimensions/migration.sql`
- Modify: `apps/worker/package.json`
- Modify: `apps/worker/tsconfig.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/worker/src/config/env.ts`
- Modify: `apps/worker/src/worker.module.ts`
- Modify: `apps/server/prisma/schema.prisma`
- Regenerate: `apps/server/prisma/generated/prisma/**`

**Interfaces:**
- Consumes: RabbitMQ `document.processing` messages matching `DocumentProcessingMessage { documentId: string }` from Task 1; `DatabaseConnection.pool`; `RabbitMqConnection.channel`; `loadEnv().OPENROUTER_API_KEY`.
- Produces: `ProcessDocumentConsumer.onModuleInit(): Promise<void>`; persisted `DocumentChunk` and `DocumentChunkEmbedding` rows for `DocumentContent.version`; terminal document status `READY` or `FAILED`.

- [ ] **Step 1: Add worker dependencies and test configuration**

Run:

```bash
pnpm --filter worker add @langchain/core @langchain/openai @langchain/textsplitters
pnpm --filter worker add -D vitest
```

Add `"test": "vitest run"` to worker scripts. Create `apps/worker/vitest.config.ts` with globals enabled, root `./`, and include `**/*.spec.ts`.

Add `"vitest/globals"` to `compilerOptions.types` in `apps/worker/tsconfig.json` so worker tests are covered by `check-types`.

Expected: worker package and lockfile use pnpm-resolved compatible LangChain packages.

- [ ] **Step 2: Write the failing consumer tests**

Create `process-document.consumer.spec.ts` with fake RabbitMQ channel, fake `pg` pool/client, and a mocked `OpenAIEmbeddings`. Capture the callback passed to `channel.consume` and cover:

```ts
it('asserts the durable queue, sets prefetch one, and starts consuming')
it('acknowledges malformed or structurally invalid messages without processing')
it('acknowledges a missing document or content without processing')
it.each(['READY', 'FAILED'])('acknowledges a %s document without processing')
it('splits text, embeds chunks in batches, replaces the current version, and marks ready')
it('marks failed when no chunks are produced')
it('marks failed when OpenRouter rejects the embedding request')
it('marks failed when the embedding count differs from the chunk count')
it('marks failed for non-finite or non-1536-dimensional embeddings')
it('rolls back chunk persistence, marks failed, and acknowledges on a database error')
it('acknowledges even when updating the failed status also fails')
```

In the success test, use text long enough for multiple chunks and assert:

- each stored chunk is at most 1000 characters;
- consecutive chunks preserve the expected 200-character overlap;
- chunk indices are zero-based and ordered;
- delete targets the same `documentId` and `contentVersion`;
- vector insert casts to `vector(1536)`;
- model and dimensions are stored exactly;
- `tokenCount`, `pageStart`, and `pageEnd` are stored as `NULL`;
- `OpenAIEmbeddings` is configured with `batchSize: 50` and the OpenRouter base URL;
- transaction order includes `BEGIN`, `DELETE`, inserts, status `READY`, and `COMMIT`;
- `ack` is called once and `nack` is never called.

- [ ] **Step 3: Run the consumer tests to verify RED**

Run: `pnpm --filter worker test`

Expected: FAIL because `ProcessDocumentConsumer` does not exist.

- [ ] **Step 4: Implement worker configuration and the consumer**

Add required `OPENROUTER_API_KEY: z.string().min(1)` to `apps/worker/src/config/env.ts`.

Create `ProcessDocumentConsumer` as an `@Injectable()` implementing `OnModuleInit`, with constructor dependencies `DatabaseConnection` and `RabbitMqConnection`. Keep these exact constants in the file:

```ts
const DOCUMENT_PROCESSING_QUEUE = 'document.processing';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 50;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
```

Configure `RecursiveCharacterTextSplitter` with the chunk constants. Configure `OpenAIEmbeddings` with the model, dimensions, batch size, OpenRouter key, and base URL.

Implement these methods:

```ts
onModuleInit(): Promise<void>;
private handleMessage(message: ConsumeMessage | null): Promise<void>;
private processDocument(documentId: string): Promise<void>;
private markDocumentFailed(documentId: string): Promise<void>;
```

Use a strict Zod payload schema. Validate embedding count, dimension, and `Number.isFinite` before opening the transaction. Use `randomUUID()` for chunk and embedding IDs. Use parameter placeholders for all data values and cast only the vector placeholder to `vector(1536)`. Always release a checked-out `PoolClient`.

Insert `NULL` for `tokenCount`, `pageStart`, and `pageEnd`. Use Nest's `Logger` for failures, never include document text or the API key, and log a second error if marking the document `FAILED` also fails.

Register `ProcessDocumentConsumer` in `WorkerModule.providers`.

- [ ] **Step 5: Run consumer tests to verify GREEN**

Run: `pnpm --filter worker test`

Expected: PASS for every listed consumer case.

- [ ] **Step 6: Constrain the database vector dimension**

Change the Prisma field to:

```prisma
embedding Unsupported("vector(1536)")?
```

Create `apps/server/prisma/migrations/20261013180000_constrain_embedding_dimensions/migration.sql`:

```sql
ALTER TABLE "document_chunk_embedding"
ALTER COLUMN "embedding" TYPE vector(1536)
USING "embedding"::vector(1536);
```

Run: `pnpm --filter server exec prisma validate`

Expected: schema is valid.

Run: `pnpm --filter server exec prisma migrate dev`

Expected: migration applies without resetting the database.

Run: `pnpm --filter server prisma:generate`

Expected: Prisma Client generation succeeds and generated schema metadata contains `vector(1536)`.

- [ ] **Step 7: Verify worker and full workspace**

Run: `pnpm --filter worker test`

Expected: PASS for every listed consumer case.

Run: `pnpm --filter worker check-types`

Expected: exit code 0.

Run: `pnpm --filter server check-types`

Expected: exit code 0.

Run: `pnpm --filter server test`

Expected: all server unit tests pass.

Run: `pnpm check-types`

Expected: all workspace type checks pass.

Run: `pnpm build`

Expected: all workspace builds pass.

- [ ] **Step 8: Commit the worker processor**

```bash
git add apps/worker/package.json apps/worker/tsconfig.json apps/worker/vitest.config.ts apps/worker/src/config/env.ts apps/worker/src/worker.module.ts apps/worker/src/jobs/process-document.consumer.ts apps/worker/src/jobs/process-document.consumer.spec.ts apps/server/prisma/schema.prisma apps/server/prisma/migrations/20261013180000_constrain_embedding_dimensions/migration.sql apps/server/prisma/generated pnpm-lock.yaml
git commit -m "feat(worker): process document embeddings"
```

### Task 3: Final end-to-end verification

**Files:**
- Modify only if verification exposes a defect in Tasks 1 or 2.

**Interfaces:**
- Consumes: publisher and consumer interfaces produced by Tasks 1 and 2.
- Produces: verified upload-to-queue and queue-to-database behavior with no additional public interface.

- [ ] **Step 1: Run all server E2E tests**

Run: `pnpm --filter server test:e2e`

Expected: all server E2E tests pass, including upload publication coverage.

- [ ] **Step 2: Run lint across the workspace**

Run: `pnpm lint`

Expected: exit code 0 with no errors.

- [ ] **Step 3: Inspect migration status**

Run: `pnpm --filter server exec prisma migrate status`

Expected: database schema is up to date.

- [ ] **Step 4: Verify the final diff**

Run: `git diff --check`

Expected: no whitespace errors outside generated Prisma files; generated-file line-ending warnings may remain unchanged.

Run: `git status --short`

Expected: only intended implementation files are modified or newly tracked.

- [ ] **Step 5: Commit any verification-only fix**

Only if Steps 1-4 required a code fix, add the exact corrected files and commit:

```bash
git commit -m "fix: complete document processing verification"
```

If no fix was needed, do not create an empty commit.
