# Etapa 4 — Upload de PDFs para Cloudflare R2

## Objetivo

Permitir upload direto e seguro de PDFs do navegador para um bucket privado do R2, seguido de confirmação e enfileiramento da ingestão.

## Dependências

- Etapas 1 a 3 concluídas.

## Limites iniciais

Manter os limites atuais da interface:

- até 10 arquivos por seleção;
- até 10 MiB por arquivo;
- MIME esperado: `application/pdf`;
- extensão esperada: `.pdf`.

Os limites devem existir no frontend e no server. A validação final ocorre no worker pelo conteúdo real do arquivo.

## Fluxo

### 1. Preparação no navegador

Para cada arquivo:

1. Validar extensão, MIME e tamanho.
2. Calcular SHA-256 com Web Crypto.
3. Solicitar uma URL pré-assinada.

### 2. Solicitação da URL

Endpoint:

```text
POST /api/organizations/:organizationId/bots/:botId/sources/presign
```

Body:

```json
{
  "filename": "manual.pdf",
  "mimeType": "application/pdf",
  "byteSize": 1048576,
  "sha256": "<hex>"
}
```

O server:

1. Valida sessão, membership e pertencimento do bot.
2. Rejeita duplicidade `(bot_id, sha256)` com `409`.
3. Cria `bot_source` em `awaiting_upload`.
4. Gera chave opaca:

```text
<environment>/organizations/<organizationId>/bots/<botId>/sources/<sourceId>.pdf
```

5. Gera PUT URL com expiração de 10 minutos e `Content-Type: application/pdf` assinado.
6. Retorna `sourceId`, `uploadUrl`, headers obrigatórios e expiração.

O nome original nunca compõe a chave R2.

### 3. PUT direto no R2

O navegador envia o arquivo diretamente:

- método `PUT`;
- mesmo `Content-Type` assinado;
- progresso individual por arquivo;
- timeout e cancelamento por `AbortController`;
- capturar `ETag` exposto pelo CORS.

O frontend não recebe credenciais permanentes do R2.

### 4. Confirmação

Endpoint:

```text
POST /api/organizations/:organizationId/bots/:botId/sources/:sourceId/complete
```

Body:

```json
{
  "etag": "\"...\""
}
```

O server executa `HeadObject` e confirma:

- objeto existe na chave esperada;
- tamanho coincide;
- Content-Type coincide;
- fonte ainda está `awaiting_upload`.

Depois, em uma operação idempotente:

1. atualiza para `queued`;
2. grava ETag;
3. publica job BullMQ com `jobId = sourceId`.

Se publicar no Redis falhar após atualizar o banco, uma rotina reconciliadora deve reenfileirar fontes `queued` sem job ativo. Não usar transação distribuída.

## Listagem e gestão de fontes

Endpoints:

- `GET .../sources?limit=20&cursor=...`
- `DELETE .../sources/:sourceId`
- `POST .../sources/:sourceId/retry`

Regras:

- delete marca a fonte como `deleting`; o worker remove o objeto R2 e depois apaga a linha;
- um reconciliador reenfileira fontes `deleting` se a publicação inicial falhar;
- retry só aceita `failed`;
- fontes em `processing` não podem ser reenfileiradas manualmente;
- listagem retorna status, erro sanitizado, páginas, chunks e datas;
- nunca retornar `r2_object_key` nem URL permanente ao frontend.

## Detecção real do arquivo

MIME e extensão são apenas filtros preliminares. No início do job, o worker deve:

- limitar bytes lidos;
- validar assinatura `%PDF-`;
- rejeitar arquivo criptografado sem senha;
- rejeitar arquivo corrompido;
- impedir decompression bombs por limites de páginas, texto e tempo;
- não executar conteúdo incorporado.

## Estados de UI

Cada item mostra:

- calculando hash;
- preparando;
- enviando com percentual;
- aguardando processamento;
- processando;
- pronto;
- falha com ação de retry;
- cancelado.

Fechar o modal não deve apagar uploads já iniciados sem confirmação. Falhas parciais não cancelam arquivos que concluíram.

## Limpeza

Criar rotina periódica para:

- remover fontes `awaiting_upload` expiradas;
- remover objetos órfãos no prefixo conhecido;
- reenfileirar fontes `queued` sem job;
- registrar métricas, sem logar URLs assinadas.

## Critérios de aceite

- PDF válido vai diretamente do browser ao R2.
- Credenciais R2 não aparecem no bundle ou nas respostas.
- URL expira e só aceita PUT com Content-Type assinado.
- Confirmação rejeita objeto ausente ou metadados divergentes.
- Mesmo PDF não pode ser adicionado duas vezes ao mesmo bot.
- Upload parcial de múltiplos arquivos é representado corretamente.
- Após confirmação, existe uma fonte `queued` e um único job.
- Delete e retry são idempotentes.
