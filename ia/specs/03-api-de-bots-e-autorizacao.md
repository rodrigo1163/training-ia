# Etapa 3 — API de bots e autorização

## Objetivo

Implementar CRUD de bots e instalações do widget com autorização por organização, contratos validados e paginação.

## Dependências

- Etapas 1 e 2 concluídas.

## Organização do server

Separar módulos por domínio:

```text
apps/server/src/modules/bots/
  bot.routes.ts
  bot.schemas.ts
  bot.service.ts
  bot.repository.ts
  bot.errors.ts
```

- Routes: HTTP, cookies, status code e serialização.
- Schemas: Zod para params, query, body e response.
- Service: autorização e regras de negócio.
- Repository: queries Drizzle sempre filtradas por tenant.
- Errors: erros de domínio convertidos por um error handler comum.

Registrar o módulo a partir de `buildServer`, mantendo `src/index.ts` apenas como inicialização HTTP.

## Autorização

Criar um pre-handler reutilizável que:

1. Obtém a sessão pelo Better Auth usando os headers da requisição.
2. Rejeita ausência de sessão com `401`.
3. Resolve a organização recebida no path.
4. Confirma uma linha em `member` para `session.user.id` e `organization.id`.
5. Anexa ao request um contexto tipado `{ userId, organizationId, organizationSlug }`.

Como todos os membros podem gerenciar bots, não há verificação de role no MVP. A checagem deve ocorrer no servidor em cada endpoint; `activeOrganizationId` da sessão não é prova suficiente de acesso.

Para evitar enumeração entre tenants, um `botId` existente fora da organização deve responder como `404`.

## Endpoints privados de bot

Base:

```text
/api/organizations/:organizationId/bots
```

### `POST /`

Cria bot em `draft`.

Body:

```json
{
  "name": "Suporte",
  "description": "Responde dúvidas da documentação"
}
```

O servidor define UUID, modelos, dimensão, prompt default, creator e organização. Responde `201`.

### `GET /`

Lista bots com cursor opaco:

```text
?limit=20&cursor=<base64url(createdAt,id)>&status=active
```

- limite default 20, máximo 100;
- ordenação determinística `created_at DESC, id DESC`;
- retorna `items` e `nextCursor`;
- inclui contagens agregadas de fontes `ready`, `processing` e `failed`;
- não carrega chunks.

### `GET /:botId`

Retorna detalhes e resumo das fontes. Não retorna embeddings, conteúdo dos chunks nem segredo completo da instalação.

### `PATCH /:botId`

Permite alterar:

- `name`;
- `description`;
- `systemPrompt`;
- `status`;
- `widgetConfig`.

Não permite alterar modelo de embedding ou dimensão no MVP. Usar update parcial com allowlist explícita.

### `DELETE /:botId`

- Exige confirmação explícita no body ou header conforme padrão escolhido na UI.
- Atualiza o bot para `deleting` de forma idempotente.
- Publica uma tarefa de cleanup; um reconciliador reenfileira bots `deleting` se o Redis estava indisponível.
- O worker remove os objetos R2 e, somente depois, apaga o bot e seus dados por cascade.
- Bots `deleting` deixam de aparecer nas listagens normais.
- Responde `202`.

Não executar chamada remota ao R2 dentro de uma transação longa do PostgreSQL.

## Endpoints privados de instalação

Base:

```text
/api/organizations/:organizationId/bots/:botId/installations
```

- `POST /`: cria instalação com nome e `allowedOrigins`; retorna a chave completa uma única vez.
- `GET /`: lista prefixo, origens, status e datas.
- `PATCH /:installationId`: altera nome, origens ou status.
- `POST /:installationId/rotate`: invalida a chave anterior e retorna uma nova uma única vez.
- `DELETE /:installationId`: revoga/remove a instalação.

Normalização de origens:

- aceitar somente URL com esquema e host;
- produção exige HTTPS;
- remover path, query e fragment;
- converter host para lowercase;
- rejeitar wildcard no MVP;
- permitir `http://localhost:<porta>` apenas fora de produção.

## Contratos de erro

Formato comum:

```json
{
  "error": {
    "code": "BOT_NOT_FOUND",
    "message": "Bot não encontrado.",
    "requestId": "..."
  }
}
```

Mensagens públicas não devem revelar SQL, R2, OpenRouter ou existência de recursos de outro tenant.

## Concorrência

- Atualizações usam `updated_at`.
- O `PATCH` deve aceitar uma versão/`updatedAt` conhecida e retornar `409` em edição concorrente, ou documentar last-write-wins no MVP.
- Criação de instalação e rotação de chave devem ser transacionais.

## Critérios de aceite

- Usuário sem sessão recebe `401`.
- Usuário fora da organização recebe `404` ou `403` sem vazamento de dados.
- Membro de qualquer role da organização consegue gerenciar bots.
- Não é possível acessar bot de outra organização alterando UUID ou organizationId.
- Listagem possui limite e cursor estável.
- Modelos e dimensão não podem ser alterados por payload.
- Chave completa de instalação aparece apenas na criação/rotação.
- Testes de integração cobrem autorização cruzada entre duas organizações.
