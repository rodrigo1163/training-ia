# 05 — Limites configuráveis do chat

Status: implementado com valores provisórios; valores finais em discussão.

## Objetivo

Permitir que o usuário configure limites por bot e por conversa.

## TODO

- [x] Permitir limite diário por bot.
- [x] Permitir limite de mensagens do usuário por conversa.
- [x] Manter `null` como opção de ilimitado.
- [x] Usar valores padrão/provisórios até a decisão final do produto.
- [x] Validar inteiros positivos no frontend e backend.
- [x] Aplicar o limite diário em UTC.
- [x] Manter incremento protegido contra concorrência.
- [x] Contar somente mensagens do usuário aceitas pelo backend.
- [x] Garantir que falha, interrupção ou streaming posterior não desfaçam o consumo.
- [x] Cobrir criação de conversa, limite atingido, idempotência e concorrência com testes.

## Implementação atual

- `maxMessagesPerDay` limita a quantidade de mensagens `USER` aceitas pelo bot
  no dia UTC.
- `maxUserMessagesPerConversation` limita a quantidade de mensagens `USER`
  aceitas em cada conversa.
- Ambos os limites aceitam `null` para ilimitado e, provisoriamente, valores
  inteiros de `1` a `1.000.000`.
- O frontend envia a configuração somente no submit do formulário; limpar um
  campo envia `null`.
- O backend reserva os contadores e cria a conversa/mensagens na mesma
  transação. `ChatDailyUsage` usa upsert condicionado e
  `ChatConversation.userMessageCount` usa `UPDATE ... WHERE count < limit`,
  protegendo as duas regras contra concorrência.
- A verificação de `clientMessageId` ocorre dentro da transação e a unicidade
  persistida da mensagem protege retries concorrentes. Falhas posteriores do
  streaming apenas alteram a mensagem do assistant e não desfazem a reserva.
- A mensagem inicial automática do assistant não incrementa nenhum contador.

## Decisões em aberto

- Definir os valores máximos finais para cada limite.
- Definir se haverá limites diferentes por plano ou organização.
