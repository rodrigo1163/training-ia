# 04 — Catálogo de modelos e seção de configuração

Status: implementado

## Objetivo

Criar uma seção própria do formulário para modelo, parâmetros, limites e
geração de starter questions.

## TODO

- [x] Separar essa seção das informações gerais e aparência do chat.
- [x] Substituir o input livre de modelo por seleção do catálogo permitido.
- [x] Permitir temperatura opcional.
- [x] Permitir máximo de tokens opcional.
- [x] Permitir ativar/desativar geração de starter questions.
- [x] Compartilhar o catálogo entre backend e frontend.
- [x] Definir identificador e nome exibido de cada modelo.
- [ ] Registrar provider e modelo recomendado.
- [x] Registrar suporte a temperatura e máximo de tokens.
- [ ] Registrar limite de contexto quando disponível.
- [x] Registrar o modelo principal e o modelo secundário de sugestões.
- [x] Validar os campos no frontend e novamente no backend.

## Implementação

- O modelo padrão é exibido no select, mas continua sendo enviado como `null`.
- Temperatura e máximo de tokens aceitam `null`, exibem erros no campo e são
  desabilitados quando o modelo não oferece o respectivo parâmetro.
- O máximo de tokens respeita o limite do catálogo quando disponível e o teto
  global já validado pelo backend.
- As configurações de IA usam o mesmo submit da configuração do chat; não há
  autosave.
- Os limites diário e por conversa permanecem desabilitados e serão tratados na
  atividade 05.
