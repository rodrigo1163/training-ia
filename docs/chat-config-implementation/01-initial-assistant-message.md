# 01 — Persistência da mensagem inicial

Status: planejado

## Objetivo

Persistir a mensagem inicial configurada como uma mensagem `ASSISTANT` no
primeiro envio do usuário e incluí-la no histórico da geração.

## TODO

- [ ] Criar a conversa e a mensagem inicial antes da mensagem do usuário.
- [ ] Garantir que a mensagem inicial seja criada apenas uma vez por conversa.
- [ ] Registrar a mensagem inicial como `ASSISTANT` e estado aceito.
- [ ] Enviar a mensagem inicial no histórico do modelo.
- [ ] Manter o comportamento de `Clear` no modo de teste.
- [ ] Cobrir conversa nova, retry e envio duplicado com testes.

## Dependências

- Contrato atual de criação de turno do chat.
- Histórico técnico limitado às últimas 20 mensagens.
