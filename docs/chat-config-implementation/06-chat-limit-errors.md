# 06 — Tratamento dos erros de limite no widget

Status: planejado

## Objetivo

Exibir mensagens específicas para os limites sem comparar texto livre retornado
pela API.

## TODO

- [ ] Propagar o código do erro HTTP para o widget.
- [ ] Reconhecer o código de limite diário.
- [ ] Reconhecer o código de limite por conversa.
- [ ] Exibir mensagem específica para cada caso.
- [ ] Permitir `Clear` no modo de teste quando o limite da conversa for atingido.
- [ ] Não oferecer reset local para o limite diário.
- [ ] Manter fallback para erros desconhecidos.
- [ ] Cobrir os dois códigos com testes do cliente.
