# 01 — Cores do texto das mensagens

Status: proposta pronta para implementação.

## Objetivo

Permitir personalizar separadamente o texto das mensagens do assistente e do
usuário, mantendo o cálculo automático atual como default.

## Situação atual

O widget permite configurar o fundo de cada tipo de mensagem. Quando um fundo
customizado existe, `getReadableForeground` escolhe preto ou branco; caso
contrário, as classes do tema atual definem o texto. Não há campos persistidos
para as cores do texto das bolhas.

O [spike de aparência anterior](../spec/chat-appearance-and-avatar.md)
escolheu texto automático para preservar legibilidade. Esta proposta atualiza
essa decisão somente para as mensagens: o cálculo continua sendo o default, mas
passa a existir uma substituição manual opcional.

## Contrato proposto

```ts
assistantMessageTextColor: string | null;
userMessageTextColor: string | null;
```

- `null` mantém o foreground automático atual, calculado a partir do fundo
  efetivo da bolha.
- Valor explícito substitui o cálculo somente nas mensagens com conteúdo.
- Erros continuam usando o estilo de erro. Estados vazios de streaming não
  ganham fundo ou texto customizado.
- Timestamps, links e conteúdo Markdown herdam a cor escolhida, respeitando os
  estilos de erro atuais.
- O preview atualiza imediatamente; o botão `Save changes` persiste os campos
  dirty pelo PATCH existente.
- O picker usa o mesmo formato seguro de cor do restante da seção. Valores com
  alpha continuam permitidos e devem ser compostos sobre o fundo real antes de
  calcular o contraste.

## Acessibilidade e contraste

- Sem override, manter `getReadableForeground` e seu fallback para o melhor
  foreground calculado; não declarar garantia WCAG caso o melhor candidato ainda
  fique abaixo do limite aplicável.
- Com override manual, calcular no playground a razão de contraste sobre o fundo
  efetivo da mensagem. Mostrar aviso junto ao campo quando texto normal ficar
  abaixo de 4,5:1 e refletir o resultado no preview.
- O aviso não bloqueia o salvamento: a escolha manual pode ser intencional, mas
  a UI deve deixar clara a perda de legibilidade. O backend continua responsável
  por rejeitar sintaxe de cor inválida.
- Testar transparência de fundo e de texto, mensagens longas, links, Markdown,
  timestamps e estados de erro/geração.

## Impacto de implementação

1. Adicionar dois valores padrão vazios e campos de cor em `ChatStyleSection`.
2. Estender `chatConfigSchema`, `getChatConfigValues`, o preview local e a
   construção do patch dirty.
3. Adicionar campos nullable a `ChatConfig` no web, server e widget; incluí-los
   no schema HTTP estrito, na validação de cores do domínio, no presenter e no
   resolver de defaults.
4. Adicionar colunas `TEXT NULL` em uma migração Prisma. Não preencher valores
   existentes.
5. No widget, usar a cor manual quando presente; caso contrário, manter o
   caminho atual de cálculo/classes.
6. Reutilizar o helper de contraste compartilhado no playground ou ampliá-lo
   para calcular sobre cores compostas. Não criar parser de cor divergente sem
   necessidade.

## Fallback e compatibilidade

Bots sem os novos campos recebem `null` e mantêm exatamente a escolha de texto
atual. Falha no carregamento da configuração pública continua usando os defaults
locais do widget. Campo inválido não deve resultar em CSS arbitrário; deve ser
rejeitado pelo schema/domínio e não aplicado pelo widget.

## Critérios de aceite

- Há um picker independente para texto do assistente e do usuário.
- `null` mantém o comportamento atual; uma cor válida aparece no preview antes
  de salvar.
- O PATCH parcial altera somente o campo editado e a mudança sobrevive a
  reload.
- O presenter público retorna os campos e o widget os aplica apenas às bolhas
  com conteúdo.
- Erros, streaming vazio e estados de parada continuam identificáveis.
- Valores inválidos são rejeitados no frontend e backend.
- Overrides com contraste baixo mostram aviso e continuam editáveis.

## Validação prevista

Cobrir cores claras e escuras, alpha sobre fundos diferentes, mensagens do
assistente e do usuário, valor `null`, erro de streaming, Markdown e apresentação
no modo inline e flutuante.

## Dependências e decisões restantes

Depende apenas do contrato de configuração atual. Não há decisão de produto
pendente; a política recomendada é aviso não bloqueante para contraste manual
abaixo de 4,5:1.
