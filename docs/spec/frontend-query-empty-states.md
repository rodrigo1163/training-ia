# Spec: estados vazios para consultas de coleções e opções

## Status

Proposta pronta para implementação.

## Objetivo

Garantir que toda busca assíncrona que alimenta uma coleção visível ou as opções de um controle tenha um estado vazio explícito quando responder com sucesso sem itens.

O estado vazio deve ser diferente de carregamento, erro e ausência de resultados causada por um filtro. Nenhuma lista, tabela, card ou menu de opções pode ficar visualmente em branco quando a resposta for válida, mas não contiver itens.

## Regra obrigatória

Todo consumidor de uma consulta que retorna uma coleção deve:

1. Renderizar loading com o `Skeleton` do projeto enquanto a consulta estiver pendente.
2. Renderizar erro em um componente dedicado, com retry quando houver `refetch`.
3. Renderizar um componente de empty quando a consulta terminar com uma coleção vazia.
4. Diferenciar o empty da coleção inteira do empty de busca/filtro sem resultados.
5. Manter o empty no menor escopo compartilhado pelos consumidores atuais.

Isso se aplica a:

- tabelas e listas de bots, documentos e organizações;
- cards responsivos que representam a mesma coleção;
- resultados de busca e filtros alimentados por uma consulta;
- `Select`, combobox e menus cujas opções vêm de uma consulta;
- loaders do TanStack Router que carregam coleções antes de renderizar uma rota.

### Selects e comboboxes

Quando as opções de um `Select` ou combobox vierem de uma consulta, o menu deve renderizar uma mensagem ou componente de empty quando a coleção estiver vazia. Não renderizar um menu aberto sem conteúdo e não confundir “nenhuma opção disponível” com erro de carregamento.

Opções estáticas definidas no código não precisam de empty de consulta. Exemplos atuais são:

- `botPersonalities` e `botLanguages` em `bot-playground.tsx`;
- opções `5`, `10` e `20` do tamanho de página em `fetch-data-table.tsx`.

## Inventário do `apps/web`

### 1. Lista de bots

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/bots-table.tsx`

- Consulta: `useBotsQuery`.
- Coleção: `Bot[]`.
- Empty atual: mensagem inline para organização sem bots e mensagem diferente para busca sem resultados.
- Layouts: a mesma decisão é repetida na tabela desktop e nos cards mobile.

#### Ajuste necessário

Criar `bots-table-empty.tsx` na pasta `bots/-components/` e reutilizá-lo nos dois layouts. O componente deve aceitar pelo menos o modo da mensagem (`search` ou `collection`) e manter:

- `No bots found.` para busca sem correspondência;
- `No bots created yet.` para organização sem bots;
- o mesmo espaço visual nos layouts desktop e mobile.

O estado de erro já possui `bots-table-error.tsx` e não deve ser reutilizado como empty.

### 2. Lista de documentos

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/bots/-components/fetch-data-table.tsx`

- Consulta: `useFetchDataQuery`.
- Coleção: `query.data.documents`.
- Empty atual: mensagens inline para bot sem documentos e busca sem resultados.
- Layouts: a mesma decisão é repetida na tabela desktop e nos cards mobile.
- Select de tamanho de página: usa opções estáticas e não precisa de empty de consulta.

#### Ajuste necessário

Criar `fetch-data-empty.tsx` na pasta `bots/-components/` e reutilizá-lo nos dois layouts. O componente deve diferenciar:

- `No documents found.` quando há um termo de busca sem correspondência;
- `No documents added yet.` quando o bot não possui documentos;
- o estado de uma página sem itens, caso a paginação ou o filtro produza uma página vazia apesar de existir total em outra página.

O estado deve continuar distinto de `fetch-data-error.tsx` e dos Skeletons de tabela/cards.

### 3. Tela de organizações

Arquivo: `apps/web/src/routes/(private)/organizations.tsx`

- Loader: `authClient.organization.list()` em `beforeLoad`.
- Coleção: organizações do usuário.
- Empty atual: o loader redireciona diretamente para `/create-organization` quando não há organizações.
- Estado visual no componente: não existe um empty dedicado para a resposta vazia.

#### Ajuste necessário

Definir um componente `organizations-empty.tsx` no escopo de `(private)` ou da rota, com mensagem e CTA para criar a primeira organização. A implementação deve decidir se o redirect continua sendo a estratégia de navegação ou se a rota renderiza o empty diretamente, mas a resposta vazia não pode desaparecer sem uma representação visual explícita.

O estado não deve ser tratado como erro do loader.

### 4. Loader do layout da organização

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/route.tsx`

- Loader: `authClient.organization.list()` em `beforeLoad`.
- Coleção: organizações disponíveis para validar o `orgSlug` e selecionar a organização ativa.
- Empty atual: redirect para `/create-organization` quando a coleção está vazia.
- Erro e pending: já possuem estados de rota compartilhados em `../../-components/organization-route-states.tsx`.

#### Ajuste necessário

Reutilizar o empty de organizações quando a coleção retornar vazia, ou documentar uma composição de rota equivalente que mostre a mensagem e o CTA antes de concluir a navegação. O redirect não deve produzir uma tela vazia ou um erro genérico.

O caso de `orgSlug` inexistente, quando a coleção não está vazia, continua sendo redirect para a primeira organização e não é um empty da coleção.

### 5. Organization switcher

Arquivo: `apps/web/src/routes/(private)/org/$orgSlug/-components/organization-switcher.tsx`

- Não executa uma consulta própria.
- Consome `organizations` do contexto do loader de `org/$orgSlug`.
- O loader atual garante uma organização antes de renderizar o layout.

#### Decisão

Não criar um empty local duplicado neste componente. O contrato do contexto deve continuar garantindo coleção não vazia; caso esse contrato mude, o switcher deverá receber um estado vazio dedicado para o menu.

### 6. Consultas de item único

Os componentes abaixo não retornam coleções e, portanto, não entram na regra de empty de listas/opções:

- `useBotQuery` em `$botSlug.tsx`;
- `useDeploymentQuery` em `bot-embed.tsx` e `bot-chat.tsx`;
- `useFetchDataDetailsQuery` em `document-details-dialog.tsx`.

Eles ainda precisam separar loading, erro e ausência do item. O caso “bot não publicado”, “deployment inativo” e “documento indisponível” deve continuar com representação própria, mas não é o mesmo contrato de empty de coleção.

### 7. Eventos e mutations

`useFetchDataEvents`, uploads, criação, edição, publicação e exclusão não fazem consultas de coleção para renderização direta. Eles ficam fora desta spec. Seus feedbacks de pending/erro devem seguir os padrões já existentes.

## Componentes esperados

Os novos componentes devem permanecer próximos dos consumidores:

```text
apps/web/src/routes/(private)/
├── -components/
│   ├── organizations-empty.tsx
│   └── organization-route-states.tsx
└── org/$orgSlug/bots/-components/
    ├── bots-table-empty.tsx
    └── fetch-data-empty.tsx
```

Não criar um empty global para todas as coleções e não mover esses componentes para `packages/ui` sem reutilização real entre frontends.

## Critérios de aceite

- Toda consulta de coleção possui loading, erro e empty distintos.
- Bots e documentos usam um empty dedicado nos layouts desktop e mobile, sem duplicar a marcação.
- Busca sem resultados não é apresentada como “coleção vazia”.
- Menus de opções vindas de consulta mostram empty explícito quando não houver opções.
- Selects com opções estáticas não recebem abstrações de empty desnecessárias.
- A ausência de organizações possui uma representação visual ou fluxo de empty explícito antes de desaparecer em redirects.
- O menu de organizações não cria um estado vazio duplicado enquanto o loader garantir a coleção não vazia.
- `pnpm check-types` passa.
- `pnpm build` passa quando a implementação estiver concluída.

## Fora do escopo

- Alterar contratos de API.
- Transformar opções estáticas em consultas.
- Criar um componente global de empty para todas as features.
- Alterar os estados de loading e erro já tratados, salvo quando a extração do empty exigir ajuste de composição.
