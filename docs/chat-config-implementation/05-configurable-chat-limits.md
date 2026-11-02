# 05 — Limites configuráveis do chat

Status: planejado; valores finais em discussão.

## Objetivo

Permitir que o usuário configure limites por bot e por conversa.

## TODO

- [ ] Permitir limite diário por bot.
- [ ] Permitir limite de mensagens do usuário por conversa.
- [ ] Manter `null` como opção de ilimitado.
- [ ] Usar valores padrão/provisórios até a decisão final do produto.
- [ ] Validar inteiros positivos no frontend e backend.
- [ ] Aplicar o limite diário em UTC.
- [ ] Manter incremento protegido contra concorrência.
- [ ] Contar somente mensagens do usuário aceitas pelo backend.
- [ ] Garantir que falha, interrupção ou streaming posterior não desfaçam o consumo.
- [ ] Cobrir criação de conversa, limite atingido e concorrência com testes.

## Decisões em aberto

- Definir os valores máximos finais para cada limite.
- Definir se haverá limites diferentes por plano ou organização.
