CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "bot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text DEFAULT 'Você é um assistente útil. Responda com base na documentação fornecida. Se a informação não estiver no contexto, diga que não encontrou.' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"chat_model" text DEFAULT 'google/gemini-2.5-flash' NOT NULL,
	"embedding_model" text DEFAULT 'openai/text-embedding-3-small' NOT NULL,
	"embedding_dimensions" integer DEFAULT 1536 NOT NULL,
	"widget_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_chunk" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bot_chunk_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" text NOT NULL,
	"bot_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"content_sha256" text NOT NULL,
	"token_count" integer,
	"page_number" integer,
	"embedding" vector(1536) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"bot_id" uuid NOT NULL,
	"uploaded_by_user_id" text,
	"type" text DEFAULT 'pdf' NOT NULL,
	"status" text NOT NULL,
	"status_message" text,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256" text NOT NULL,
	"r2_object_key" text NOT NULL,
	"r2_etag" text,
	"page_count" integer,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"processing_version" integer DEFAULT 1 NOT NULL,
	"error_code" text,
	"error_message" text,
	"trigger_run_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bot" ADD CONSTRAINT "bot_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot" ADD CONSTRAINT "bot_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_chunk" ADD CONSTRAINT "bot_chunk_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_chunk" ADD CONSTRAINT "bot_chunk_bot_id_bot_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_chunk" ADD CONSTRAINT "bot_chunk_source_id_bot_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."bot_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_source" ADD CONSTRAINT "bot_source_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_source" ADD CONSTRAINT "bot_source_bot_id_bot_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_source" ADD CONSTRAINT "bot_source_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bot_organization_created_id_idx" ON "bot" USING btree ("organization_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bot_organization_status_idx" ON "bot" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "bot_created_by_user_id_idx" ON "bot" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bot_chunk_source_index_uidx" ON "bot_chunk" USING btree ("source_id","chunk_index");--> statement-breakpoint
CREATE INDEX "bot_chunk_org_bot_idx" ON "bot_chunk" USING btree ("organization_id","bot_id");--> statement-breakpoint
CREATE INDEX "bot_chunk_source_id_idx" ON "bot_chunk" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "bot_chunk_embedding_hnsw_idx" ON "bot_chunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "bot_source_bot_sha256_uidx" ON "bot_source" USING btree ("bot_id","sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "bot_source_r2_object_key_uidx" ON "bot_source" USING btree ("r2_object_key");--> statement-breakpoint
CREATE INDEX "bot_source_org_bot_created_idx" ON "bot_source" USING btree ("organization_id","bot_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bot_source_status_pending_idx" ON "bot_source" USING btree ("status") WHERE "bot_source"."status" IN ('awaiting_upload', 'queued', 'processing', 'deleting');--> statement-breakpoint
CREATE INDEX "bot_source_uploaded_by_user_id_idx" ON "bot_source" USING btree ("uploaded_by_user_id");