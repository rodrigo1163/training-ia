# 06 — Tratamento dos erros de limite no widget

Status: concluído

## Objetivo

Exibir mensagens específicas para os limites sem comparar texto livre retornado
pela API.

## TODO

- [x] Propagar o código do erro HTTP para o widget.
- [x] Reconhecer o código de limite diário.
- [x] Reconhecer o código de limite por conversa.
- [x] Exibir mensagem específica para cada caso.
- [x] Permitir `Clear` no modo de teste quando o limite da conversa for atingido.
- [x] Não oferecer reset local para o limite diário.
- [x] Manter fallback para erros desconhecidos.
- [x] Cobrir os dois códigos com testes do cliente.

## Decisões de implementação

- O backend já retorna `code` e `message` no corpo HTTP dos erros `429`; a
  atividade não altera esse fluxo.
- O widget só preserva códigos presentes no contrato oficial
  `@training-ia/contracts`. Códigos ausentes ou desconhecidos mantêm o status
  HTTP e a mensagem recebida como fallback, ou usam a mensagem genérica quando
  não houver mensagem.
- As mensagens dos limites são definidas pelo widget e selecionadas pelo
  código, sem comparação com o texto retornado pela API. Eventos SSE `error`
  seguem a mesma regra.
- `Clear` continua disponível no modo `test` para erros desconhecidos e para o
  limite por conversa, iniciando uma nova conversa local. Para o limite diário,
  o botão é ocultado e a ação também é bloqueada no hook para não oferecer um
  reset local como forma de contornar o limite. No modo `public`, o botão nunca
  é renderizado.
