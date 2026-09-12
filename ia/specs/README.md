# Plano de implementação: bots com RAG e widget embed

## Objetivo

Evoluir a área de bots para permitir que cada organização crie bots isolados, envie PDFs para uma base de conhecimento própria e disponibilize um widget incorporável em sites de clientes.

As specs estão divididas em etapas implementáveis e devem ser executadas na ordem abaixo. Cada etapa precisa atender aos seus critérios de aceite antes da próxima começar.

## Decisões aprovadas

- Identificador de bot: UUID.
- Isolamento da base de conhecimento: por bot.
- Armazenamento dos PDFs: Cloudflare R2.
- Upload: navegador direto para o R2 por URL pré-assinada.
- Processamento assíncrono: Redis, BullMQ e processo worker separado.
- Orquestração de IA: LangChain.js.
- Gateway de IA: OpenRouter em `https://openrouter.ai/api/v1`.
- Modelo de chat: `google/gemini-3.7-flash`.
- Modelo de embedding: `openai/text-embedding-3-small`.
- Dimensão do embedding: 1536.
- Busca vetorial: PostgreSQL com pgvector e distância cosseno.
- Widget: script leve que cria um iframe isolado.
- Permissão de gestão: qualquer membro autenticado da organização.
- Histórico de chat no MVP: stateless; nenhuma conversa ou mensagem será persistida.

## Ordem das etapas

1. [Infraestrutura e fundações](./01-infraestrutura-e-fundacoes.md)
2. [Banco de dados e pgvector](./02-banco-de-dados-e-pgvector.md)
3. [API de bots e autorização](./03-api-de-bots-e-autorizacao.md)
4. [Upload de PDFs para o R2](./04-upload-de-pdfs-r2.md)
5. [Worker de ingestão e embeddings](./05-worker-de-ingestao.md)
6. [Interface de listagem e detalhe do bot](./06-interface-de-bots.md)
7. [Chat RAG stateless](./07-chat-rag-stateless.md)
8. [Widget incorporável](./08-widget-embed.md)
9. [Segurança, testes, observabilidade e rollout](./09-qualidade-e-rollout.md)

## Regras transversais

- Toda consulta privada deve validar sessão e vínculo na organização no servidor.
- Nunca confiar em `organizationId`, `botId`, nome do arquivo, MIME type ou tamanho enviados pelo cliente sem validação.
- Toda consulta a fontes e chunks deve incluir `organization_id` e `bot_id`.
- O binário do PDF fica apenas no R2; o PostgreSQL armazena metadados, estado de processamento, texto extraído e embeddings.
- Chaves do OpenRouter, R2 e Redis existem apenas no servidor/worker.
- A chave pública do widget identifica uma instalação, mas não autoriza o chat sozinha.
- Rotas de listagem devem usar paginação por cursor; não carregar coleções sem limite.
- Operações assíncronas precisam ser idempotentes e tolerar retry.
- Não editar manualmente `apps/web/src/routeTree.gen.ts`; regenerar pelo fluxo do TanStack Router.
- Usar `pnpm` em todos os comandos.

## Fora do escopo do MVP

- Fontes TXT, planilhas e URLs.
- OCR de PDFs compostos apenas por imagens.
- Histórico de conversas e analytics de mensagens.
- Reranking com modelo dedicado.
- Compartilhamento de uma base de conhecimento entre bots.
- Permissões granulares além da associação do usuário à organização.
- Troca de modelo de embedding sem reindexação.

## Portões de validação

Ao concluir cada etapa:

1. Rodar os testes adicionados pela etapa.
2. Rodar `pnpm check-types`.
3. Rodar `pnpm build` quando houver mudança de runtime, rota ou configuração.
4. Verificar que dados de uma organização ou bot não podem ser acessados por outro.
5. Não avançar se houver migration incompleta, job não idempotente ou segredo exposto no cliente.

## Referências técnicas

- `mcps/langchain.md`
- `mcps/open-router.md`
- LangChain.js: clientes OpenAI-compatible via `configuration.baseURL`.
- OpenRouter embeddings: endpoint OpenAI-compatible com modelo e dimensão explícitos.
- Cloudflare R2: API S3-compatible e URLs PUT pré-assinadas.
- Drizzle ORM: coluna `vector({ dimensions: 1536 })` e índice HNSW com `vector_cosine_ops`.
