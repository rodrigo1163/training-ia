# 02 — Starter questions geradas em paralelo

Status: concluído; a política de seleção em novas conversas permanece pendente.

## Objetivo

Gerar uma nova pergunta da IA em uma chamada HTTP separada, sem esperar o fim
do streaming principal e sem bloquear ou invalidar a resposta principal.

## TODO

- [x] Definir o endpoint ou contrato de aplicação para geração de uma pergunta.
- [x] Iniciar a geração em paralelo ao envio da mensagem principal.
- [x] Definir quais dados entram no prompt da geração paralela.
- [x] Usar o modelo secundário do catálogo.
- [x] Gerar no máximo uma pergunta válida por solicitação.
- [x] Evitar perguntas já usadas após normalização.
- [x] Substituir somente o slot da starter question acionada.
- [x] Deixar o slot vazio quando a geração falhar.
- [x] Persistir a pergunta em uma tabela própria reutilizável pelo mesmo bot.
- [ ] Definir como perguntas persistidas serão selecionadas para novas conversas.
- [x] Não deixar uma falha da geração paralela marcar a resposta principal como falha.
- [ ] Cobrir concorrência, cancelamento e retry com testes E2E completos.

## Implementação

- O endpoint `POST /public/chat/:deploymentKey/starter-questions` valida o
  deployment ativo, a origem permitida, a conversa, a mensagem do usuário, a
  pergunta clicada e o slot. O controller somente traduz transporte e erros;
  a regra fica em `GenerateStarterQuestionUseCase`.
- O widget envia a pergunta principal normalmente. Ao receber o evento SSE
  `metadata`, dispara a chamada do endpoint secundário sem aguardá-la. A
  chamada secundária pode ser cancelada junto com a principal e seus erros são
  isolados.
- O prompt usa a pergunta clicada, as últimas 20 mensagens anteriores sem a
  mensagem atual, os documentos recuperados por `KnowledgeRetriever`, as
  starter questions configuradas, as perguntas de usuário do histórico e as
  perguntas já geradas para o bot.
- A IA usa `STARTER_QUESTIONS_MODEL_ID`, recebe `maxTokens: 120` e o caso de
  uso aceita no máximo o primeiro texto de pergunta válido. A comparação de
  duplicidade aplica `trim`, lowercase e normalização de espaços.
- `BotGeneratedStarterQuestion` armazena `originalText`, `normalizedText`,
  `status`, `createdAt` e o vínculo com `Bot`. A restrição única é
  `(botId, normalizedText)`; uma colisão concorrente não gera uma segunda
  pergunta.
- O slot clicado é limpo imediatamente. Se a chamada secundária falhar ou
  retornar duplicata, ele permanece vazio; os demais slots não são alterados.
- Mensagens digitadas livremente não iniciam a chamada secundária.

## Dados obrigatórios para a geração

- Pergunta clicada pelo usuário.
- Histórico da conversa.
- Documentos e contexto de conhecimento do bot.
- Perguntas já utilizadas pelo usuário ou geradas anteriormente.

## Persistência

- A entidade pertence ao `Bot`, não à `ChatConversation`.
- A tabela permite consultar e reutilizar perguntas em conversas futuras do
  mesmo bot, mas a política de seleção ainda não foi implementada.
- A normalização e a restrição única impedem duplicatas textuais.
- A falha da persistência ou da geração secundária não invalida a resposta
  principal, pois as chamadas usam endpoints/casos de uso separados.

## Decisão ainda aberta

As perguntas geradas são persistidas no bot e retornadas para a sessão atual.
Nesta atividade, o widget substitui o slot clicado apenas no estado local da
sessão. Não há seleção automática dessas perguntas para novas conversas nem
alteração definitiva das perguntas configuradas pelo administrador. A política
de seleção futura, incluindo quando marcar uma pergunta como `USED`, fica para
uma atividade posterior.
