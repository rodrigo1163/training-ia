# Etapa 2 — Banco de dados e pgvector

## Objetivo

Criar o modelo relacional multi-tenant para bots, fontes PDF, chunks vetoriais e instalações do widget.

## Dependências

- Etapa 1 concluída.
- pgvector habilitado.

## Convenções

- IDs novos: `uuid` com `defaultRandom()`.
- IDs do Better Auth continuam `text`.
- Datas: `timestamp with time zone`.
- Nomes físicos: `snake_case`.
- Estados: `text` com `CHECK`, evitando enum PostgreSQL para facilitar evolução.
- Toda foreign key deve ter índice.
- Campos flexíveis de apresentação usam `jsonb`; campos consultados frequentemente usam colunas próprias.

## Tabela `bot`

| Coluna                 | Tipo            | Regra                                     |
| ---------------------- | --------------- | ----------------------------------------- |
| `id`                   | `uuid`          | PK, default random                        |
| `organization_id`      | `text`          | FK `organization.id`, cascade             |
| `created_by_user_id`   | `text` nullable | FK `user.id`, set null                    |
| `name`                 | `text`          | obrigatório                               |
| `description`          | `text` nullable |                                           |
| `system_prompt`        | `text`          | obrigatório, default seguro               |
| `status`               | `text`          | `draft`, `active`, `archived`, `deleting` |
| `chat_model`           | `text`          | `google/gemini-3.7-flash`                 |
| `embedding_model`      | `text`          | `openai/text-embedding-3-small`           |
| `embedding_dimensions` | `integer`       | `1536`, check positivo                    |
| `widget_config`        | `jsonb`         | default objeto vazio                      |
| `created_at`           | `timestamptz`   | default now                               |
| `updated_at`           | `timestamptz`   | default now                               |

Índices:

- `(organization_id, created_at DESC, id DESC)` para paginação;
- `(organization_id, status)`;
- índice da FK `created_by_user_id`.

O nome não precisa ser único. O endpoint deve aplicar limites de tamanho para nome, descrição e prompt.

## Tabela `bot_source`

| Coluna                | Tipo                   | Regra                              |
| --------------------- | ---------------------- | ---------------------------------- |
| `id`                  | `uuid`                 | PK                                 |
| `organization_id`     | `text`                 | FK organization, cascade           |
| `bot_id`              | `uuid`                 | FK bot, cascade                    |
| `uploaded_by_user_id` | `text` nullable        | FK user, set null                  |
| `type`                | `text`                 | no MVP apenas `pdf`                |
| `status`              | `text`                 | ver máquina de estados             |
| `original_filename`   | `text`                 | nome para exibição                 |
| `mime_type`           | `text`                 | no MVP `application/pdf`           |
| `byte_size`           | `bigint`               | check positivo e limite do produto |
| `sha256`              | `text`                 | hash hexadecimal                   |
| `r2_object_key`       | `text`                 | único                              |
| `r2_etag`             | `text` nullable        | preenchido na confirmação          |
| `page_count`          | `integer` nullable     | preenchido pelo worker             |
| `chunk_count`         | `integer`              | default 0                          |
| `processing_version`  | `integer`              | default 1                          |
| `error_code`          | `text` nullable        | código estável                     |
| `error_message`       | `text` nullable        | mensagem sanitizada                |
| `metadata`            | `jsonb`                | default objeto vazio               |
| `created_at`          | `timestamptz`          | default now                        |
| `updated_at`          | `timestamptz`          | default now                        |
| `processed_at`        | `timestamptz` nullable |                                    |

Máquina de estados:

```text
awaiting_upload -> queued -> processing -> ready
        |             |           |
        +----------> failed <-----+
        |
qualquer estado -> deleting
```

Um retry de `failed` volta para `queued`. Uma fonte em `awaiting_upload` expirada pode ser removida por rotina de limpeza.

Constraints e índices:

- unique `(bot_id, sha256)` para evitar PDF duplicado no mesmo bot;
- unique `r2_object_key`;
- índice `(organization_id, bot_id, created_at DESC, id DESC)`;
- índice parcial por `status` para fontes não concluídas;
- índices das FKs.

## Tabela `bot_chunk`

| Coluna            | Tipo               | Regra                         |
| ----------------- | ------------------ | ----------------------------- |
| `id`              | `bigint identity`  | PK                            |
| `organization_id` | `text`             | FK organization, cascade      |
| `bot_id`          | `uuid`             | FK bot, cascade               |
| `source_id`       | `uuid`             | FK source, cascade            |
| `chunk_index`     | `integer`          | ordem estável no documento    |
| `content`         | `text`             | texto do chunk                |
| `content_sha256`  | `text`             | integridade/idempotência      |
| `token_count`     | `integer` nullable | métrica aproximada            |
| `page_number`     | `integer` nullable | página humana iniciando em 1  |
| `embedding`       | `vector(1536)`     | obrigatório após insert final |
| `metadata`        | `jsonb`            | default objeto vazio          |
| `created_at`      | `timestamptz`      | default now                   |

Constraints e índices:

- unique `(source_id, chunk_index)`;
- btree `(organization_id, bot_id)`;
- btree `source_id`;
- HNSW `embedding vector_cosine_ops`.

Query canônica de recuperação:

```sql
SELECT
  id,
  source_id,
  content,
  page_number,
  1 - (embedding <=> $1::vector) AS similarity
FROM bot_chunk
WHERE organization_id = $2
  AND bot_id = $3
  AND source_id IN (
    SELECT id
    FROM bot_source
    WHERE organization_id = $2
      AND bot_id = $3
      AND status = 'ready'
  )
ORDER BY embedding <=> $1::vector
LIMIT $4;
```

O worker remove chunks antigos e publica o novo conjunto dentro da mesma transação.

## Tabela `bot_embed_installation`

| Coluna               | Tipo                   | Regra                      |
| -------------------- | ---------------------- | -------------------------- |
| `id`                 | `uuid`                 | PK                         |
| `organization_id`    | `text`                 | FK organization, cascade   |
| `bot_id`             | `uuid`                 | FK bot, cascade            |
| `name`               | `text`                 | nome interno da instalação |
| `public_key_hash`    | `text`                 | hash SHA-256, único        |
| `public_key_prefix`  | `text`                 | identificação segura na UI |
| `allowed_origins`    | `text[]`               | origens exatas HTTPS       |
| `is_active`          | `boolean`              | default true               |
| `created_by_user_id` | `text` nullable        | FK user, set null          |
| `created_at`         | `timestamptz`          | default now                |
| `updated_at`         | `timestamptz`          | default now                |
| `last_used_at`       | `timestamptz` nullable | atualização amortizada     |

Gerar chave aleatória com pelo menos 256 bits. Mostrar a chave completa uma única vez e armazenar apenas seu hash. Permitir rotação criando nova instalação ou nova chave.

## Relações Drizzle

Definir relações:

- organization → bots;
- bot → organization, creator, sources e installations;
- source → bot, organization, uploader e chunks;
- chunk → source, bot e organization;
- installation → bot, organization e creator.

Relações facilitam leitura, mas não substituem filtros explícitos de tenant nas queries.

## Migration

- Gerar migration via Drizzle; não escrever nomes de migration manualmente.
- Revisar SQL gerado para `CREATE EXTENSION`, `vector(1536)`, HNSW, checks, cascades e índices.
- Migration deve ser aplicada primeiro em banco descartável.
- Testar rollback operacional via restauração de backup; o Drizzle não garante downgrade automático.

## Critérios de aceite

- Todas as tabelas e constraints existem.
- Todas as foreign keys têm índices.
- Não é possível inserir chunk com dimensão diferente de 1536.
- Não é possível duplicar o mesmo PDF no mesmo bot pelo SHA-256.
- Deletar bot remove fontes, chunks e instalações.
- Deletar usuário não remove conteúdo do bot.
- Uma busca vetorial filtrada por organização e bot usa o índice esperado com volume de teste.
- Tipos Drizzle não usam `any`.
