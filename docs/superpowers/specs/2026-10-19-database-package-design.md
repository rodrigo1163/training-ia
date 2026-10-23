# Database local do server

## Objetivo

Manter o Prisma pertencente ao próprio `apps/server`, sem um pacote backend
compartilhado em `packages/`.

## Estrutura

- `apps/server/prisma/schema.prisma` é a fonte do schema.
- `apps/server/prisma/migrations/` contém o histórico de migrations.
- `apps/server/prisma/generated/prisma/` contém o client gerado.
- `apps/server/prisma.config.ts` define schema, migrations e datasource.
- `apps/server/src/infra/database/prisma/prisma.service.ts` mantém o ciclo de
  vida NestJS e cria o adapter PostgreSQL.

## Comandos

Os comandos do Prisma são executados no pacote `server`:

- `pnpm --filter server prisma:generate`
- `pnpm --filter server db:migrate`
- `pnpm --filter server db:deploy`

O script `auth:generate` também escreve em `prisma/schema.prisma` dentro do
server.

## Compatibilidade

O schema, as migrations e os modelos não devem ser alterados durante uma
migração de estrutura. O restante do backend importa o client diretamente de
`apps/server/prisma/generated/prisma/client.js`.
