# Plano de implementação do chat

Status: atividades 01, 02, 03 e 04 concluídas; as atividades 05 e 06 permanecem pendentes.

## Decisões registradas

- Não implementar agora o estado específico de erro dos loaders de organizações.
- Manter o salvamento da configuração por submit de formulário; não haverá autosave.
- Gerar starter question sem esperar o fim do streaming principal, possivelmente por outro endpoint.
- Considerar na geração a pergunta clicada, o histórico da conversa, os
  documentos do bot e as perguntas já utilizadas.
- Persistir perguntas geradas em uma tabela própria por bot.
- Persistir a mensagem inicial no primeiro envio do usuário como mensagem `ASSISTANT`.
- Manter, por enquanto, a validação das starter questions no frontend.
- Permitir que o usuário configure modelo, parâmetros e limites.
- Tratar códigos de erro de limite no widget.
- Usar um catálogo de modelos com metadados.
- Manter modelo, parâmetros, limites e geração de starter questions em uma seção separada do formulário principal.
- Usar valores provisórios para os limites enquanto os valores finais permanecem em discussão.
- Persistir starter questions geradas em `BotGeneratedStarterQuestion`, com
  unicidade por `(botId, normalizedText)` e chave de idempotência; controlar a
  reutilização por conversa em `BotGeneratedStarterQuestionUsage`.
- Iniciar a geração secundária a partir do evento `metadata` do streaming
  principal, usando endpoint separado para não bloquear a resposta.
- Calcular uma chave de idempotência no backend com bot, conversa, mensagem e
  slot, protegida por unicidade no catálogo de perguntas geradas.
- Tratar `BotGeneratedStarterQuestion` como catálogo global do bot e registrar
  o uso por conversa em uma tabela própria, sem bloquear reutilização global.

## TODO

- [x] Implementar a persistência da mensagem inicial no primeiro envio.
- [x] Implementar a geração paralela de starter questions.
- [x] Definir o contrato da tabela de perguntas geradas por bot.
- [x] Adicionar idempotência à geração de starter questions.
- [x] Registrar uso, exibição e clique de perguntas por conversa.
- [x] Selecionar perguntas configuradas e preencher slots com o catálogo global.
- [x] Completar a validação das starter questions no frontend.
- [x] Criar a seção separada de modelo, geração e limites no formulário.
- [x] Implementar o catálogo de modelos com metadados.
- [ ] Implementar limites configuráveis usando valores provisórios.
- [ ] Tratar mensagens específicas para os limites diário e por conversa no widget.

## Fora do plano atual

- Estado específico de erro dos loaders de organizações.
- Autosave e debounce da configuração do chat.
