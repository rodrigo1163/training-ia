# Etapa 9 — Segurança, testes, observabilidade e rollout

## Objetivo

Validar o sistema de ponta a ponta, reduzir riscos de isolamento e custos e preparar ativação gradual em produção.

## Dependências

- Etapas 1 a 8 concluídas.

## Matriz mínima de testes

### Unitários

- schemas Zod;
- normalização de origens;
- geração e hash de public keys;
- cursor de paginação;
- máquina de estados de fontes;
- construção de prompt;
- deduplicação de citações;
- classificação de erros retryable/permanentes.

### Integração com PostgreSQL e Redis reais

- migrations em banco vazio;
- constraints e cascades;
- CRUD por tenant;
- claim concorrente do worker;
- publicação atômica de chunks;
- jobId idempotente;
- query vetorial filtrada;
- rotação/revogação de instalação.

Mocks de banco não substituem estes testes.

### Integração de serviços externos

- R2 em bucket de teste ou adapter S3-compatible local;
- OpenRouter com adapter fake determinístico na suíte normal;
- smoke test real opcional e separado para chat/embedding, controlado por env e limite de custo.

### E2E

1. Criar organização e bot.
2. Abrir detalhe por UUID.
3. Enviar PDF.
4. Acompanhar até `ready`.
5. Criar instalação e origem.
6. Incorporar snippet em página externa de fixture.
7. Perguntar conteúdo presente e validar citação.
8. Perguntar conteúdo ausente e validar fallback.
9. Tentar usar a mesma chave em origem não autorizada.
10. Revogar instalação e validar bloqueio.

## Testes obrigatórios de isolamento

Criar duas organizações, dois usuários, dois bots e dois PDFs com frases exclusivas.

Validar:

- usuário A não lista, lê, altera ou exclui bot B;
- source A não pode ser anexada a bot B;
- busca do bot A nunca retorna chunk B;
- token da instalação A não acessa config/chat B;
- cursor e filtros não atravessam organização;
- logs/erros não revelam existência do recurso B.

## Segurança

Checklist:

- secrets somente em server/worker;
- cookies e CORS do painel preservados;
- policy CORS separada para embed;
- public keys armazenadas como hash;
- tokens embed com audience e expiração;
- allowed origins sem wildcard;
- payloads e arquivos com limites;
- PDF validado por magic bytes;
- texto de documentos tratado como não confiável;
- prompt injection testada;
- mensagens públicas sanitizadas;
- URLs pré-assinadas nunca logadas;
- queries parametrizadas via Drizzle;
- dependências auditadas;
- bucket R2 privado;
- endpoint de health não revela segredos.

Se o banco for exposto futuramente por Supabase Data API, habilitar RLS em todas as tabelas expostas. No desenho atual com Postgres acessado somente pelo Fastify, o controle principal fica na API, mas filtros multi-tenant continuam obrigatórios.

## Observabilidade

### Logs

Todos os serviços usam logs JSON com:

- `requestId` ou `jobId`;
- ambiente e serviço;
- organização/bot/source/installation quando aplicável;
- duração e status;
- código de erro estável.

Aplicar redaction a:

- Authorization;
- Cookie;
- chaves OpenRouter/R2;
- public key completa;
- token embed;
- presigned URL;
- conteúdo de PDF e chat.

### Métricas

- latência e erros por endpoint;
- fila: waiting, active, completed, failed e stalled;
- ingestão por fase;
- páginas/chunks;
- embeddings e tokens;
- latência de retrieval e geração;
- respostas sem contexto;
- sessões embed aceitas/rejeitadas;
- rate limit;
- estimativa de custo por bot/organização.

### Alertas

- crescimento de jobs failed/stalled;
- erro de dimensão de embedding;
- falhas de autenticação dos provedores;
- aumento de `429`;
- latência de chat;
- taxa anormal de sessões negadas;
- storage ou banco próximos do limite.

## Performance

Antes do lançamento, criar dataset sintético com múltiplos bots e medir:

- tempo de ingestão;
- memória do worker;
- tamanho de `bot_chunk`;
- plano `EXPLAIN (ANALYZE, BUFFERS)` da busca filtrada;
- latência p50/p95 do primeiro token;
- impacto do HNSW;
- concorrência segura por worker.

Não particionar tabela nem introduzir vector database externa sem evidência.

Quando a escala inicial for definida, registrar SLOs e limites:

- bots por organização;
- PDFs por bot;
- páginas/chunks por PDF;
- uploads concorrentes;
- chats concorrentes;
- orçamento por organização.

## Rollout

1. Aplicar migration com backup validado.
2. Subir Redis.
3. Subir worker com concorrência baixa.
4. Subir server com endpoints privados desativados por feature flag.
5. Liberar criação/upload para organização interna.
6. Executar PDFs de teste e validar retrieval.
7. Liberar widget somente para domínio de teste.
8. Observar métricas e custos.
9. Expandir gradualmente.

Feature flags recomendadas:

- `BOTS_ENABLED`;
- `PDF_INGESTION_ENABLED`;
- `EMBED_WIDGET_ENABLED`.

## Runbooks

Documentar:

- reenfileirar fonte;
- investigar job stalled;
- rotacionar segredo/token;
- revogar instalação comprometida;
- remover objeto órfão;
- reprocessar embeddings após mudança de modelo;
- restaurar banco;
- indisponibilidade de OpenRouter, R2 ou Redis.

## Critérios de aceite

- Testes unitários, integração e E2E passam.
- Matriz de isolamento passa integralmente.
- Nenhum segredo ou conteúdo aparece nos logs.
- Busca vetorial tem plano e latência registrados.
- Alertas e dashboards mínimos existem.
- Rollout interno conclui upload → ingestão → chat → citação.
- Feature flags permitem desativar ingestão e widget sem derrubar o painel.
- `pnpm check-types` e `pnpm build` passam no monorepo.
