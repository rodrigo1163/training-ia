# Spec: estados de loading e erro nas consultas do frontend

## Status

Proposta pronta para implementacao.

## Objetivo

Garantir que toda consulta assincrona que renderiza dados do servidor apresente estados visuais explicitos de carregamento, erro e estado vazio, sem deixar paginas, tabs, paineis ou listas vazios durante uma requisicao.

## Regra obrigatoria

Todo consumidor de uma query deve:

1. Renderizar um estado de loading usando o componente `Skeleton` do projeto enquanto a consulta estiver pendente.
2. Renderizar um componente de erro dedicado quando a consulta falhar.
3. Oferecer retry quando a query disponibilizar `refetch`.
4. Diferenciar loading, erro e resposta vazia sem dados.
5. Manter os componentes no menor escopo que atende aos consumidores atuais.

### Colocacao dos componentes

- Um consumidor: componente local ou pasta `-components/` da rota.
- Varios consumidores da mesma feature: pasta comum mais proxima da feature.
- Varios frontends: package frontend compartilhado somente quando houver reutilizacao real.

Exemplos esperados:

```text
src/routes/(private)/org/$orgSlug/bots/
├── $botSlug.tsx
└── -components/
    ├── bot-details-error.tsx
    ├── bot-details-skeleton.tsx
    ├── deployment-error.tsx
    └── deployment-skeleton.tsx
```

## Escopo

Esta spec cobre consultas React Query e buscas assincronas de dados usadas nas telas do `apps/web`, incluindo as consultas exibidas dentro de tabs e modais.

Mutations de criar, editar, publicar, excluir e fazer upload nao fazem parte do inventario de queries, mas devem continuar exibindo feedback de pending e erro conforme os padroes existentes.

## Inventario atual

### 1. Detalhes do bot e tabs

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/$botSlug.tsx`

- Query: `useBotQuery`.
- Existe Skeleton somente para titulo e descricao.
- As tabs sao renderizadas durante o loading.
- Os conteudos de Playground, Embed e Chat ficam vazios ate `query.data` existir.
- O erro possui retry, mas esta implementado inline.

Implementacao prevista:

- Criar `bot-details-skeleton.tsx` para representar cabecalho e tabs.
- Criar `bot-details-error.tsx` com mensagem e retry.
- Nao renderizar as tabs de sucesso enquanto o bot estiver pendente.

### 2. Embed e Chat

Arquivos:

- `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/bot-embed.tsx`
- `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/bot-chat.tsx`

- Query compartilhada: `useDeploymentQuery`.
- Embed mostra texto simples no loading e no erro.
- Chat retorna `null` no loading.
- Chat possui estado de erro, mas nao possui retry.

Implementacao prevista:

- Criar `deployment-skeleton.tsx` na pasta `bots/-components/`.
- Criar `deployment-error.tsx` na mesma pasta.
- Reutilizar esses componentes em Embed e Chat.
- O erro deve aceitar uma acao de retry e, quando necessario, uma acao para abrir Embed.

### 3. Lista de bots

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/bots-table.tsx`

- Query: `useBotsQuery`.
- Loading possui Skeleton para tabela, cards e paginacao.
- Erro possui retry, mas a marcacao esta duplicada entre desktop e mobile.

Implementacao prevista:

- Manter `LoadingRows` e `LoadingCards` ou extrai-los para componentes locais de Skeleton.
- Criar um `bots-table-error.tsx` reutilizavel pelas variacoes desktop e mobile.
- Preservar o estado vazio para busca sem resultados e para organizacao sem bots.

### 4. Lista de documentos

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/fetch-data-table.tsx`

- Query: `useFetchDataQuery`.
- Loading possui Skeleton para tabela, cards e paginacao.
- Erro possui retry, mas esta duplicado entre desktop e mobile.

Implementacao prevista:

- Manter os Skeletons especificos de tabela e cards.
- Criar `fetch-data-error.tsx` para os dois layouts.
- Preservar os estados vazios de busca e de bot sem documentos.

### 5. Detalhes do documento

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/document-details-dialog.tsx`

- Query: `useFetchDataDetailsQuery`.
- Loading possui Skeleton.
- Erro possui retry recebido por prop.
- Os estados ainda estao misturados na composicao principal do dialog.

Implementacao prevista:

- Criar componentes locais para loading e erro do dialog, se a separacao melhorar a leitura.
- Manter o retry no mesmo escopo do dialog.
- Manter o estado de documento inexistente separado do erro de requisicao.

### 6. Loaders de organizacao

Arquivos:

- `apps/web/src/routes/(private)/org/$orgSlug/route.tsx`
- `apps/web/src/routes/(private)/organizations.tsx`

Esses arquivos fazem buscas em `beforeLoad` usando `authClient.organization.list()`. Elas nao sao queries React Query e atualmente nao possuem componentes de pending/error especificos no nivel do router.

Implementacao prevista:

- Definir uma estrategia de pending visual para navegacao de rotas.
- Definir uma estrategia de error visual para falhas dos loaders.
- Colocar os componentes no escopo da rota ou em um componente de router compartilhado somente se houver reutilizacao real.

## Criterios de aceite

- Nenhuma tab ou painel de dados aparece vazio por causa de uma query pendente.
- Toda query que renderiza dados possui Skeleton visivel no espaco correspondente.
- Toda falha de query possui mensagem de erro dedicada.
- Queries com `refetch` oferecem botao de retry.
- Estados de erro nao sao duplicados entre os layouts desktop e mobile sem necessidade.
- Estados vazios continuam distintos de loading e erro.
- Componentes novos ficam na pasta mais proxima dos consumidores.
- `pnpm check-types` passa.
- `pnpm build` passa quando a implementacao estiver concluida.

## Ordem sugerida de implementacao

1. Detalhes do bot e tabs.
2. Deployment compartilhado entre Embed e Chat.
3. Lista de bots.
4. Lista de documentos.
5. Dialog de detalhes do documento.
6. Loaders de organizacao no router.

## Fora do escopo

- Alterar o contrato das APIs.
- Criar um componente global de Skeleton para todos os casos.
- Mover componentes para `packages/ui` sem reutilizacao real entre frontends.
- Alterar os estados de sucesso ou vazio alem do necessario para separar os estados.
