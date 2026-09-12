# Etapa 1 — Infraestrutura e fundações

## Objetivo

Preparar PostgreSQL com pgvector, Redis com BullMQ, Cloudflare R2 e os clientes LangChain/OpenRouter sem implementar ainda o fluxo funcional de RAG.

## Dependências

- Nenhuma etapa anterior.
- Conta e bucket no Cloudflare R2.
- Chave de API do OpenRouter.

## Decisões de estrutura

Criar um processo de worker separado do processo HTTP. O desenho preferencial é:

- `apps/server`: Fastify, autenticação, API privada e API pública do widget.
- `apps/worker`: consumidor BullMQ, download do PDF, extração, chunking e embeddings.
- `packages/database`: schema Drizzle e criação de conexões compartilhados por server e worker.
- `packages/contracts`: somente se tipos compartilhados começarem a ser duplicados; não criar antecipadamente.

O pool do PostgreSQL não deve ser um singleton criado ao importar o módulo compartilhado. Expor uma factory para permitir que server e worker criem e encerrem seus próprios pools.

## PostgreSQL e pgvector

1. Descobrir a versão major atual com `SHOW server_version`.
2. Fixar uma imagem `pgvector/pgvector` compatível com essa major; não usar tag `latest`.
3. Antes de trocar a imagem atual da Bitnami, documentar e executar backup ou recriação consciente do volume. Os caminhos de dados das imagens são diferentes e o volume existente não deve ser reutilizado cegamente.
4. Adicionar à migration inicial do domínio:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

5. Verificar a extensão com `SELECT extversion FROM pg_extension WHERE extname = 'vector';`.

## Redis e BullMQ

- Adicionar Redis ao `docker-compose.yml`, com imagem versionada, healthcheck e volume próprio.
- Server e worker usam `REDIS_URL`.
- Definir uma fila `bot-source-ingestion`.
- Usar `sourceId` como `jobId` para impedir jobs duplicados da mesma versão da fonte.
- Configuração inicial de retry:
  - 5 tentativas;
  - backoff exponencial;
  - jobs concluídos removidos após retenção curta;
  - jobs falhos mantidos para diagnóstico.
- O worker deve responder a `SIGTERM`/`SIGINT`, parar de aceitar jobs e encerrar Redis/Postgres corretamente.

## Cloudflare R2

Usar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` porque o R2 implementa a API S3-compatible.

Variáveis esperadas:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PRESIGNED_URL_TTL_SECONDS=600
```

Configurar CORS do bucket:

- origens: os ambientes conhecidos do app web;
- métodos: `PUT`;
- headers permitidos: `Content-Type`;
- headers expostos: `ETag`;
- não tornar o bucket público.

Separar buckets por ambiente ou, no mínimo, prefixar todas as chaves com o ambiente.

## OpenRouter e LangChain

Dependências previstas:

- `@langchain/openai`
- `@langchain/core`
- `@langchain/textsplitters`
- loader de PDF oficial compatível com a versão instalada do LangChain

Configuração:

```text
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_CHAT_MODEL=google/gemini-3.7-flash
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_EMBEDDING_DIMENSIONS=1536
OPENROUTER_APP_URL=
OPENROUTER_APP_NAME=Training IA
```

Criar factories separadas para chat e embeddings. Ambas devem usar a base URL do OpenRouter, a chave privada e os headers recomendados `HTTP-Referer` e `X-Title`. Não instanciar clientes por chunk.

Antes da implementação, confirmar na versão instalada de `@langchain/openai` que `OpenAIEmbeddings` encaminha `dimensions` e a configuração de base URL. Se a integração não encaminhar algum campo do OpenRouter, encapsular a chamada HTTP em um adapter que implemente a interface de embeddings do LangChain; não espalhar `fetch` pelo domínio.

## Validação de ambiente

O schema Zod do server e do worker deve:

- falhar no boot se uma variável obrigatória estiver ausente;
- validar URLs e inteiros positivos;
- nunca logar valores de segredos;
- permitir que testes injetem configuração sem ler variáveis globais.

## Critérios de aceite

- PostgreSQL inicia com pgvector habilitado.
- Redis inicia saudável e aceita conexão do server e do worker.
- Server e worker possuem processos e scripts independentes.
- O worker encerra graciosamente.
- Um teste de smoke cria uma embedding de 1536 posições pelo OpenRouter.
- O cliente R2 gera uma URL PUT pré-assinada sem expor credenciais.
- `.env.example` documenta apenas placeholders.
- `pnpm check-types` e `pnpm build` passam.

## Não fazer nesta etapa

- Não criar endpoints de negócio.
- Não processar uploads no Fastify.
- Não guardar PDFs no PostgreSQL.
- Não adicionar suporte a fontes além de PDF.
