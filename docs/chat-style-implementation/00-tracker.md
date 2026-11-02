# Plano de implementação das opções de aparência do chat

Status: descoberta concluída; proposta pronta para decomposição e implementação.

## Objetivo

Ampliar a personalização visual do chat com controles para cores do texto das
mensagens, botão flutuante, borda, tipografia e temas prontos. Cada etapa possui
uma página própria para que seja implementada, revisada e validada separadamente.

## Baseline analisado

O playground já configura largura e altura do painel, raios dos cantos, sombra,
posição do widget e cores das principais superfícies. A configuração é salva por
submit explícito, pertence ao `Bot` e é compartilhada por seus deployments. O
preview recebe os valores locais do formulário sem aguardar o salvamento.

Há controles relacionados em outras seções: avatar, status do cabeçalho,
mensagem inicial, texto do campo de entrada e timestamps. Eles não serão
duplicados neste plano.

O widget roda em Shadow DOM. O modo flutuante é posicionado pelo `apps/widget`;
o preview do playground usa `displayMode="inline"`.

## Decisões transversais

- Manter a configuração no `Bot`; todos os deployments do bot compartilham os
  mesmos estilos.
- Manter o endpoint PATCH de configuração existente e sua semântica parcial.
  Não criar endpoints ou uma entidade separada para aparência.
- Manter o submit explícito e o preview local imediato. Não introduzir autosave.
- Persistir novos campos como colunas nullable. `null` preserva o estilo atual
  para bots já existentes; o widget resolve os defaults em um único lugar.
- Atualizar os contratos repetidos de frontend, domínio, presenter público e
  widget juntos. O contrato público retorna apenas campos que o widget precisa.
- Aceitar somente cores CSS seguras já suportadas pelo projeto. Não persistir
  CSS arbitrário, nomes de classe ou estilos fornecidos pelo usuário.
- Preservar a experiência de desktop e o comportamento atual de instalações
  antigas quando não há configuração nova.
- Manter mensagens, identidade do bot, configuração de IA e limites fora do
  escopo visual.

## Etapas

1. [Cores do texto das mensagens](./01-message-text-colors.md)
2. [Botão flutuante](./02-floating-launcher.md)
3. [Borda do painel](./03-chat-border.md)
4. [Tipografia](./04-typography.md)
5. [Temas prontos](./05-theme-presets.md)

## Dependências entre etapas

As etapas 1 a 4 adicionam opções independentes ao mesmo contrato de chat. A
etapa 5 depende das cores das etapas 1, 2 e 3 e funciona como conveniência de
edição: ela aplica valores aos campos já existentes, sem criar uma segunda
fonte de verdade.

## Mapa de impacto técnico

| Camada | Trabalho esperado |
| --- | --- |
| Playground web | Campos em `ChatStyleSection`, validação e defaults em `form-utils`, preview em `ChatConfigSection` e inclusão dos campos dirty no patch. |
| API web | Atualizar `ChatConfig` e `ChatConfigPatch` em `apps/web/src/api/bots/types.ts`. |
| HTTP server | Estender o schema parcial estrito do endpoint existente e o presenter público. |
| Domínio | Estender `ChatConfig`, defaults, validação, normalização e limites em `chat-config.ts`. |
| Persistência | Adicionar colunas nullable no modelo `Bot` e migrações SQL por etapa persistida. |
| Widget | Estender tipos e resolução em `apps/widget/src/types/chat.ts` e `helpers/chat-config.ts`; aplicar estilos e comportamento em `chat-widget.tsx` e, para posicionamento, `embed.tsx`. |
| Contrato público | Incluir os campos visuais no presenter que alimenta `GET /public/chat/:deploymentKey/config`; não expor configuração interna. |

## Regras gerais de compatibilidade

- Campo ausente em um PATCH significa “não alterar”; `null` significa usar o
  default do widget.
- Migrações não devem preencher valores em bots antigos: isso mantém `null`
  como sinal de compatibilidade e evita congelar defaults dentro do banco.
- Ao atualizar o contrato, preservar fallback quando a configuração pública
  estiver indisponível.
- O widget deve tolerar campos `null` enquanto clientes antigos e novos
  coexistirem durante o deploy.
- Não alterar a semântica atual de salvar somente campos dirty.

## Estratégia de validação

Cada página define critérios próprios. Na implementação, a validação deve cobrir
schema do formulário, normalização e validação de domínio, PATCH parcial,
persistência/releitura, presenter público, defaults do widget, preview imediato,
modo inline e modo flutuante.

## Critério geral de saída

As cinco etapas estão concluídas quando todas as opções persistem por bot,
aparecem corretamente no preview e na instalação pública, mantêm os defaults
para bots antigos, não quebram os modos inline/flutuante e passam pelos critérios
de acessibilidade e compatibilidade documentados em cada página.
