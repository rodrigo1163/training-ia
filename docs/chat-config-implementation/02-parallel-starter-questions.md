# 02 — Starter questions geradas em paralelo

Status: planejado; decisões principais definidas.

## Objetivo

Gerar uma nova pergunta da IA sem esperar o fim do streaming principal e sem
bloquear ou invalidar a resposta principal.

## TODO

- [ ] Definir o endpoint ou contrato de aplicação para geração de uma pergunta.
- [ ] Iniciar a geração em paralelo ao envio da mensagem principal.
- [ ] Definir quais dados entram no prompt da geração paralela.
- [ ] Usar o modelo secundário do catálogo.
- [ ] Gerar no máximo uma pergunta válida por solicitação.
- [ ] Evitar perguntas já usadas após normalização.
- [ ] Substituir somente o slot da starter question acionada.
- [ ] Deixar o slot vazio quando a geração falhar.
- [ ] Persistir a pergunta em uma tabela própria reutilizável pelo mesmo bot.
- [ ] Definir como perguntas persistidas serão selecionadas para novas conversas.
- [ ] Não deixar uma falha da geração paralela marcar a resposta principal como falha.
- [ ] Cobrir concorrência, cancelamento e retry com testes.

## Dados obrigatórios para a geração

- Pergunta clicada pelo usuário.
- Histórico da conversa.
- Documentos e contexto de conhecimento do bot.
- Perguntas já utilizadas pelo usuário ou geradas anteriormente.

## Persistência

- A entidade pertence ao `Bot`, não à `ChatConversation`.
- A tabela deve permitir reutilizar perguntas em conversas futuras do mesmo bot.
- A normalização deve impedir duplicatas textuais.
- A falha da persistência ou da geração secundária não deve invalidar a resposta principal.
