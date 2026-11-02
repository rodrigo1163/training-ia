# 03 — Borda do painel do chat

Status: proposta pronta para implementação.

## Objetivo

Permitir configurar a borda externa do painel além do raio e da sombra já
disponíveis.

## Contrato proposto

```ts
chatBorderColor: string | null;
chatBorderWidth: number | null; // 0..4 px
```

- `null` para largura resolve em `0 px`, mantendo o painel atual sem borda
  explícita.
- Cor só altera a aparência quando a largura for maior que zero. Para `null`,
  usar um cinza neutro compatível com a paleta atual.
- A borda vale para a superfície externa do painel, não para separadores internos
  de mensagens, sugestões ou campo de entrada.
- Largura inteira de 0 a 4 px; largura zero é o equivalente a “sem borda”.
- A largura configurada do chat continua representando a caixa externa, com
  `box-sizing: border-box`, para que adicionar borda não aumente a geometria.
- `chatRadius` continua controlando o raio externo e deve recortar a borda e o
  conteúdo sem vazamento nos cantos.

## Impacto de implementação

Adicionar picker e slider à seção Style; atualizar valores default, validação,
preview local e patch dirty. Estender os três contratos de `ChatConfig`, o schema
PATCH, a validação de domínio, o presenter público e o resolver do widget.
Adicionar colunas `TEXT NULL` e `INTEGER NULL` no banco. Aplicar cor e largura
somente no elemento `section` que representa o painel.

## Acessibilidade e segurança

A borda é um elemento não textual. O editor deve mostrar visualmente o efeito
real sobre o fundo atual, sem permitir CSS de borda arbitrário. Cores seguem o
parser seguro já existente. Não exigir contraste textual para a borda, mas manter
foco de teclado e outlines de controles independentes da borda do painel.

## Fallback e compatibilidade

`chatBorderWidth: null` resolve em zero; bots antigos permanecem visualmente
iguais. Quando largura for zero, o widget não aplica a cor mesmo que ela esteja
salva. Valores fora do intervalo ou fracionários são rejeitados pelo contrato.

## Critérios de aceite

- Usuário pode escolher borda de 0 a 4 px e uma cor CSS segura.
- Largura zero remove a borda sem alterar a sombra ou o raio.
- Largura positiva não altera a largura/altura externa configurada do chat.
- Preview, resposta salva e widget público mostram o mesmo resultado.
- Valores `null` e dados antigos preservam o aspecto atual.

## Validação prevista

Cobrir largura 0 e 4, transparência, cantos 0 e 32, sombras `none` e `2xl`,
overflow do conteúdo e larguras de chat mínima e máxima.

## Dependências e decisões restantes

Não há dependência funcional além do contrato atual. Se o painel precisar de uma
borda diferente da dos controles internos, manter nomes e aplicação isolados;
não reutilizar `border-border` global para a superfície externa.
