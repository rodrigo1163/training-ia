# Etapa 6 — Interface de listagem e detalhe do bot

## Objetivo

Transformar `/org/$orgSlug/bots` em listagem e criar `/org/$orgSlug/bots/$botId` como área de gestão do bot selecionado.

## Dependências

- Etapas 1 a 5 concluídas.

## Estrutura de rotas

Reorganizar a rota atual para permitir filhos:

```text
apps/web/src/routes/(private)/org/$orgSlug/bots/
  route.tsx
  index.tsx
  $botId.tsx
```

- `route.tsx`: layout da área de bots e `<Outlet />`.
- `index.tsx`: listagem em `/org/:orgSlug/bots`.
- `$botId.tsx`: detalhe em `/org/:orgSlug/bots/:botId`.

Regenerar a route tree pelo comando do projeto. Não editar `routeTree.gen.ts` manualmente.

O layout de organização deve reconhecer rotas filhas para manter título e breadcrumb corretos. No detalhe, breadcrumb esperado:

```text
Bots / <nome do bot>
```

## Cliente da API

Criar um cliente HTTP pequeno e tipado para o Fastify:

- base URL vem de `VITE_API_URL`;
- `credentials: include`;
- parse consistente do contrato de erro;
- suporte a `AbortSignal`;
- sem adicionar Axios;
- endpoints agrupados por domínio.

Usar React Query para cache, loading, mutation e invalidação. Chaves devem incluir `organizationId` e `botId`.

## Tela de listagem

Conteúdo:

- título e descrição;
- botão “Criar bot”;
- cards ou tabela responsiva;
- nome, status, contagem de fontes e última atualização;
- estados vazio, carregando, erro e paginação;
- ação de abrir o detalhe;
- ações de editar/arquivar/excluir conforme padrão visual.

Criação:

- modal ou página simples;
- campos `name` e `description`;
- após sucesso, navegar para `/org/$orgSlug/bots/$botId`;
- impedir submit duplicado;
- exibir erro retornado pela API.

Paginação:

- usar cursor retornado pela API;
- não carregar todos os bots;
- manter estado de filtro/status na URL quando filtros forem adicionados.

## Tela de detalhe

Dividir em tabs pequenas:

### Dados

- mover `PdfFileUpload` da rota atual para esta tab;
- listar PDFs e estados de processamento;
- mostrar progresso de upload;
- atualizar status por polling enquanto houver `queued` ou `processing`;
- parar polling quando a aba perde relevância ou não existem pendências;
- retry e remoção por item;
- mostrar páginas, chunks, tamanho e erro sanitizado.

### Comportamento

- editar nome, descrição e `systemPrompt`;
- mostrar o modelo de chat apenas como informação no MVP;
- salvar com mutation e feedback de sucesso/erro;
- tratar conflito de edição com refetch.

### Widget

- editar aparência permitida em `widgetConfig`;
- criar/listar/revogar instalações;
- cadastrar origens autorizadas;
- exibir chave completa e snippet apenas no momento de criação/rotação;
- oferecer botão de copiar com feedback acessível;
- incluir preview isolado do widget.

## Upload de múltiplos PDFs

Evoluir o componente existente sem colocar regras de rede dentro do hook genérico de seleção.

Separação proposta:

- hook atual: seleção, drag-and-drop e validação local;
- hook de domínio: hash, presign, PUT, confirmação e cancelamento;
- componentes: dropzone, lista de uploads e linha de fonte persistida.

Após confirmação de cada arquivo, invalidar a query de fontes. Um erro em um arquivo não bloqueia os demais.

## Estado e navegação

- Usar `organizationId` retornado pelo layout autenticado, não resolver segurança pelo slug no cliente.
- Ao receber `404` para bot, mostrar página não encontrada dentro do layout.
- Ao trocar organização, caches não podem reaproveitar bots da organização anterior.
- Ao excluir o bot aberto, navegar para a listagem.

## Acessibilidade e responsividade

- Tabs, dialogs e botões com labels.
- Progresso anunciado por texto; não depender só de cor.
- Foco retorna ao gatilho ao fechar modal.
- Listagem utilizável em mobile.
- Campos exibem erros associados.

## Critérios de aceite

- `/bots` lista apenas bots da organização ativa.
- `/bots/:botId` abre o bot correto por UUID.
- Criar bot navega para seu detalhe.
- Upload de PDF existe somente no detalhe do bot.
- Status muda de upload para processamento e pronto sem recarregar a página.
- Trocar org não vaza cache.
- Estados vazio, carregando, erro e sucesso estão implementados.
- Breadcrumb funciona em listagem e detalhe.
- Route tree é regenerada e build do web passa.
