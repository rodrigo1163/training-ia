# 04 — Tipografia do chat

Status: proposta pronta para implementação.

## Objetivo

Dar controle simples de família tipográfica e tamanho das mensagens sem baixar
fontes externas nem comprometer o layout do widget.

## Contrato proposto

```ts
chatFontFamily: "sans" | "serif" | "mono" | null;
chatMessageFontSize: "sm" | "md" | "lg" | null;
```

- `null` mantém a tipografia sans-serif atual e o tamanho atual das bolhas.
- Família aplica-se ao conteúdo textual do painel inteiro por meio de stacks do
  sistema: sans-serif, serif ou monospace. Não aceitar nome ou URL de fonte
  arbitrários e não carregar Google Fonts ou outro recurso remoto.
- Tamanho aplica-se ao texto das mensagens do usuário e do assistente e ao corpo
  do Markdown; não muda dimensões de avatar, ícones, controles ou rodapé.
- Escala sugerida: `sm` 13 px, `md` 14 px (default equivalente ao atual), `lg`
  16 px. Line-height acompanha cada escala para permitir que mensagens longas
  quebrem sem clipping.
- Headings do Markdown permanecem proporcionais ao tamanho escolhido. Timestamp
  continua menor, mas cresce junto o suficiente para não se tornar ilegível.
- O painel pode ficar mais alto internamente; em altura fixa, a lista de
  mensagens rola e o campo de entrada continua visível.

## Impacto de implementação

Adicionar dois selects ao Style e enums ao schema do formulário, domínio, API,
PATCH, presenter e widget. Adicionar colunas `TEXT NULL` no modelo e migração.
`resolveChatConfig` fornece os defaults. No widget, aplicar stacks CSS locais na
raiz do painel e substituir as classes de tamanho fixo das bolhas/Markdown por
um valor controlado e seguro. Não serializar uma string CSS de fonte no banco.

## Acessibilidade e legibilidade

- Não reduzir texto abaixo de 13 px.
- O tamanho `md` deve reproduzir o layout atual para não mudar bots antigos.
- Usar reflow natural de Markdown, URLs e palavras longas; preservar
  `overflow-wrap:anywhere`.
- O layout não pode esconder o campo de entrada, estado de erro, timestamps,
  controles de fechar ou foco visível.
- A família monospace deve ser tratada como preferência opcional, não usada como
  default; testar glifos portugueses e emojis.

## Fallback e compatibilidade

Valores ausentes usam `sans` e `md`. Valores de enum desconhecidos são rejeitados
no backend/domínio e resolvidos para defaults no widget durante a coexistência de
versões.

## Critérios de aceite

- Três famílias predefinidas e três escalas estão disponíveis.
- `md` e `sans` preservam o visual atual.
- Nenhuma requisição de fonte externa é feita.
- Texto, Markdown, links, timestamp e mensagens longas se ajustam sem clipping.
- As opções persistem e aparecem no preview e widget público.

## Validação prevista

Cobrir as nove combinações, locale português, emoji, Markdown com headings/listas
e código, URL longa, altura mínima/máxima do painel, zoom do browser e janela
estreita.

## Riscos e decisões restantes

O widget usa classes Tailwind com tamanhos fixos em vários pontos do Markdown.
Antes da implementação, inventariar todos os elementos do conteúdo para não
deixar headings e blocos com uma escala parcialmente fixa. Manter tipografia
restrita a stacks do sistema reduz variações de carregamento e dependência de
rede.
