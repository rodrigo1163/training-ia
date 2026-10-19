# Pacote compartilhado de banco de dados

## Objetivo

Mover o Prisma atualmente pertencente a `apps/server/prisma/` para o pacote
compartilhado `packages/database/prisma/`. O servidor continuará responsável
pela integração NestJS e pela conexão PostgreSQL, enquanto o pacote de banco
será dono do schema, migrations, client gerado e comandos do Prisma.

## Resultado esperado

- `packages/database/prisma/schema.prisma` será a fonte do schema.
- `packages/database/prisma/migrations/` continuará contendo o histórico de
  migrations existente.
- `packages/database/prisma/generated/` conterá o client gerado.
- O pacote será identificado como `@training-ia/database`.
- O servidor consumirá o client por `@training-ia/database/client`, sem
  imports relativos para dentro de `apps/server/prisma`.
- Não haverá mais `apps/server/prisma/` nem `apps/server/prisma.config.ts`.

## Arquitetura

### Pacote `@training-ia/database`

Será criado `packages/database/package.json` com configuração ESM, scripts de
build e validação de tipos, além dos comandos `prisma:generate`, `db:migrate` e
`db:deploy`. O pacote terá `@prisma/client` como dependência de runtime e
`prisma`, `dotenv` e TypeScript como dependências de desenvolvimento conforme
necessário para gerar e compilar o client.

O arquivo `packages/database/prisma.config.ts` apontará para:

- schema: `prisma/schema.prisma`;
- migrations: `prisma/migrations`;
- datasource: `DATABASE_URL`.

O pacote exportará o client compilado pelo subpath `./client`. Um build próprio
do pacote transformará os arquivos TypeScript gerados em `dist`, permitindo
que o build do servidor dependa do pacote por meio do pipeline do Turborepo.

### Aplicação `server`

`apps/server/package.json` passará a depender de
`@training-ia/database: workspace:*`. O `PrismaService`, repositórios,
mappers, retriever e setup de testes trocarão os imports relativos pelo
subpath público do pacote.

O servidor continuará mantendo `@prisma/adapter-pg`, pois a instanciação do
client com o adapter e o ciclo de vida NestJS pertencem à aplicação. O
`tsconfig.build.json` deixará de incluir `prisma/generated`; o client será
resolvido pelo pacote construído antes do servidor, graças à dependência de
build declarada no Turborepo.

O script `auth:generate` continuará no servidor, pois usa a configuração de
autenticação localizada em `apps/server/src/infra/auth/auth.ts`, mas gravará o
schema em `../../packages/database/prisma/schema.prisma`.

## Fluxo de dados e comandos

1. `auth:generate`, executado no servidor, atualiza o schema compartilhado.
2. `prisma:generate`, executado no pacote database, gera o client em
   `packages/database/prisma/generated/prisma`.
3. `db:migrate` e `db:deploy`, executados no pacote database, usam o mesmo
   schema e diretório de migrations.
4. O build do pacote compila o client para `packages/database/dist`.
5. O build do servidor importa `@training-ia/database/client` e usa o client
   compilado com `PrismaPg`.

Nenhuma migration será criada, alterada ou executada durante esta mudança;
apenas seu caminho será transferido.

## Compatibilidade e tratamento de erros

- O nome e o conteúdo das migrations serão preservados.
- A variável `DATABASE_URL` continuará sendo obrigatória e validada pela
  configuração do Prisma.
- Imports que ainda apontarem para `apps/server/prisma` deverão ser eliminados
  antes da conclusão.
- A geração do client deve ser executada antes do type-check/build quando o
  artefato compilado não existir.
- Não será criado um segundo client nem uma segunda fonte de schema.

## Verificação

Serão executados, usando `pnpm`:

- geração do Prisma no pacote database;
- `pnpm check-types` na raiz;
- `pnpm build` na raiz;
- busca final por referências a `apps/server/prisma` e imports relativos do
  client antigo;
- inspeção do status do Git para confirmar que migrations e schema foram
  movidos, e não duplicados.

## Fora do escopo

- Alterar modelos ou migrations.
- Alterar a forma como o NestJS abre ou fecha a conexão.
- Introduzir uma camada de repositório nova.
- Alterar banco, ambiente, Docker ou dados existentes.
