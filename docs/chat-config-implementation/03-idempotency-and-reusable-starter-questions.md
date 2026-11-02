# 03 — Idempotência e reutilização de starter questions

## Objetivo

Evitar duplicidade persistida quando a mesma geração for repetida e permitir
que perguntas geradas sejam reutilizadas em outras conversas do mesmo bot.

## Decisões

- A idempotência usa `botId`, `conversationId`, `userMessageId` e `slot`,
  calculados no backend e armazenados como hash.
- A unicidade da idempotência e do texto normalizado permanece no catálogo
  `BotGeneratedStarterQuestion`.
- `BotGeneratedStarterQuestionUsage` registra `shownAt` e `clickedAt` por
  conversa; uma pergunta não é globalmente consumida.
- Perguntas configuradas têm prioridade. Os slots restantes usam perguntas
  geradas disponíveis, sem duplicar texto normalizado, ordenadas pela última
  exibição e com desempate determinístico.
- O enum `USED` foi mantido por compatibilidade, mas não bloqueia seleção.

## Checklist

- [x] Adicionar chave de idempotência, migration, entidade, mapper e repository.
- [x] Tratar repetição e conflito concorrente sem nova chamada persistida.
- [x] Criar tabela e repository de uso por conversa com cascata.
- [x] Registrar exibição e clique sem interferir no streaming principal.
- [x] Integrar seleção do catálogo à configuração pública do chat.
- [x] Cobrir casos unitários e specs E2E de persistência/isolamento.

## Pendências futuras

- Rodar os E2E em um ambiente com PostgreSQL disponível.
- Completar a validação específica das starter questions no frontend e as
  atividades futuras de configuração de modelo e limites.
