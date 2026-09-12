# Etapa 5 — Worker de ingestão e embeddings

## Objetivo

Transformar cada PDF confirmado em chunks pesquisáveis e embeddings de 1536 dimensões, com processamento idempotente e observável.

## Dependências

- Etapas 1 a 4 concluídas.
- Modelo de embedding disponível no OpenRouter.

## Pipeline

```text
job BullMQ
  -> claim da fonte
  -> download privado do R2
  -> validação PDF
  -> extração por página
  -> normalização
  -> chunking
  -> embeddings em lotes
  -> publicação transacional dos chunks
  -> status ready
```

## Claim e idempotência

Ao receber `sourceId`, o worker:

1. Busca a fonte e o bot pelo par `organization_id`/`bot_id`.
2. Encerra com sucesso se a fonte já estiver `ready`.
3. Faz update condicional `queued|failed -> processing`.
4. Se outro worker já fez o claim, encerra sem duplicar trabalho.
5. Incrementa `processing_version` em cada reprocessamento.

O processamento pode gerar dados temporários fora da transação. A publicação final deve:

1. bloquear a fonte;
2. confirmar que a versão ainda é a esperada;
3. apagar chunks anteriores da fonte;
4. inserir todos os novos chunks;
5. atualizar contagens, páginas, status e `processed_at`;
6. commit.

Assim, consultas nunca observam metade dos chunks de uma versão.

## Download do R2

- Usar `GetObject` autenticado no worker, nunca URL pública.
- Aplicar timeout, limite de bytes e cancelamento.
- Consumir stream para arquivo temporário ou buffer limitado conforme exigência do loader.
- Sempre remover arquivo temporário em `finally`.
- A chave vem apenas do banco.

## Extração de PDF

Usar o loader oficial de PDF do ecossistema LangChain compatível com Node e a versão instalada. Preservar metadados de página.

Regras:

- produzir documentos por página;
- converter página para numeração humana iniciando em 1;
- normalizar Unicode e espaços repetidos sem colar palavras;
- preservar separação de parágrafos;
- ignorar páginas sem texto;
- falhar com código específico quando todo o PDF não tiver texto;
- OCR fica fora do MVP.

## Chunking

Usar `RecursiveCharacterTextSplitter`.

Configuração inicial:

```text
chunkSize=1000
chunkOverlap=200
```

Esses valores são caracteres, não tokens, e devem ficar centralizados em configuração versionada. Chunks não devem atravessar páginas no MVP, facilitando citações.

Para cada chunk, registrar:

- `chunk_index` global dentro da fonte;
- `page_number`;
- conteúdo;
- SHA-256 do conteúdo normalizado;
- contagem aproximada de tokens, se disponível sem custo relevante;
- metadata mínima e serializável.

Descartar chunks vazios ou abaixo de um limiar mínimo após normalização.

## Embeddings via OpenRouter

Cliente LangChain:

- modelo `openai/text-embedding-3-small`;
- dimensão explícita `1536`;
- base URL `https://openrouter.ai/api/v1`;
- input de documentos marcado como `search_document` quando o adapter suportar;
- input de consulta marcado como `search_query` na etapa de recuperação.

Enviar chunks em lotes configuráveis, começando com 64. Limitar concorrência para respeitar rate limits e memória. Reutilizar uma instância do cliente.

Validar antes de persistir:

- quantidade de vetores igual à quantidade de chunks;
- cada vetor possui exatamente 1536 números;
- todos os valores são finitos;
- resposta pertence ao modelo esperado.

## Falhas e retry

Classificação:

- retry: timeout, `429`, `5xx`, indisponibilidade de R2/Redis/Postgres;
- permanente: PDF inválido, criptografado, sem texto, excedendo limites;
- configuração: chave inválida, modelo inexistente, dimensão errada; alertar e pausar retries excessivos.

Ao falhar:

- atualizar `bot_source.status = failed`;
- gravar `error_code` estável e mensagem sanitizada;
- deixar detalhes técnicos apenas em logs;
- permitir retry manual para falhas permanentes somente após substituição/reupload.

O job BullMQ deve ter timeout máximo e progresso por fase, não por log de conteúdo.

## Concorrência e escala

- Configurar concorrência do worker por ambiente.
- Um job por fonte.
- Embeddings em batches, nunca uma chamada por chunk.
- Não manter múltiplos PDFs completos em memória por worker sem limite.
- Aplicar limite máximo configurável de páginas, caracteres extraídos e chunks.
- Não particionar `bot_chunk` no MVP; medir antes.

## Observabilidade

Logs estruturados incluem:

- `jobId`, `sourceId`, `botId`, `organizationId`;
- fase;
- duração;
- páginas/chunks;
- tentativa;
- código de erro.

Nunca incluir texto extraído, embeddings, chave do R2 ou conteúdo do prompt nos logs padrão.

Métricas:

- duração por fase;
- jobs queued/active/failed;
- chunks por fonte;
- chamadas e tokens de embedding;
- taxa de retry.

## Critérios de aceite

- PDF textual válido termina em `ready`.
- Página e contagem de chunks ficam corretas.
- Chunks têm embeddings de 1536 dimensões.
- Reexecutar o mesmo job não duplica chunks.
- Falha no meio não publica conjunto parcial.
- PDF inválido ou sem texto termina em `failed` com código útil.
- Rate limit do OpenRouter causa retry com backoff.
- Dois workers não processam a mesma versão simultaneamente.
- Logs não contêm conteúdo sensível.
