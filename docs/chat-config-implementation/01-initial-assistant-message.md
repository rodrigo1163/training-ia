# 01 — Persistência da mensagem inicial

Status: concluído

## Objetivo

Persistir a mensagem inicial configurada como uma mensagem `ASSISTANT` no
primeiro envio do usuário e incluí-la no histórico da geração.

## Implementação concluída

- `createTurn` cria, na mesma transação, a conversa nova, a mensagem inicial,
  a mensagem do usuário e o placeholder da resposta principal, nessa ordem.
- A mensagem inicial é persistida como `ASSISTANT`/`COMPLETED` sem
  `clientMessageId`; conversas existentes não recebem uma segunda mensagem
  inicial.
- O caso de uso usa a mensagem inicial criada como o primeiro item do
  histórico enviado ao modelo. Quando a configuração é `null`, usa
  `Hello! 👋 How can I help you today?`.
- O contador da conversa e o uso diário continuam sendo incrementados somente
  para a mensagem do usuário.
- A proteção existente de `clientMessageId` duplicado e retry foi preservada.
- O widget não precisou de alteração: `Clear` continua removendo o
  `conversationId` local e o streaming principal continua usando o mesmo
  placeholder.

## Validação

- Testes unitários do caso de uso cobrem conversa nova, mensagem customizada e
  default, histórico sem duplicação da pergunta atual, retry duplicado,
  conversa existente e o limite das últimas 20 mensagens anteriores.
- Testes E2E do `PrismaChatRepository` cobrem a persistência transacional e o
  fato de a mensagem inicial não consumir o limite do usuário. A consulta do
  histórico também exclui a mensagem atual por ID antes de aplicar o limite.

## Dependências

- Contrato atual de criação de turno do chat.
- Histórico técnico limitado às últimas 20 mensagens.
