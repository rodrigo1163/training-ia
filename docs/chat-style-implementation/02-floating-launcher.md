# 02 — Personalização do botão flutuante

Status: proposta pronta para implementação.

## Objetivo

Permitir que a organização ajuste a cor, o tamanho e o ícone do botão que abre o
chat no modo flutuante.

## Situação atual

O botão flutuante é sempre circular, mede 56×56 px, usa o token `bg-primary` e
mostra `💬` quando fechado e `✕` quando aberto. A posição inferior direita ou
esquerda é aplicada no elemento host em `apps/widget/src/embed.tsx`. O modo
inline não mostra esse botão.

## Contrato proposto

```ts
launcherBackgroundColor: string | null;
launcherSize: number | null; // 48..72 px, passo 4
launcherIcon: "chat" | "bot" | "sparkles" | "avatar" | null;
```

- `null` preserva o comportamento de 56 px, token atual e ícone de chat.
- A cor do ícone é calculada para contraste a partir da cor de fundo; não criar
  uma segunda opção de cor de texto para o launcher nesta etapa.
- `avatar` reutiliza `avatarUrl` existente. Sem avatar configurado, renderizar o
  ícone `chat` e explicar o fallback no controle.
- Ícones `chat`, `bot` e `sparkles` são assets SVG locais, sem fontes externas,
  emojis decorativos obrigatórios ou HTML informado pelo usuário.
- O estado aberto continua exibindo o controle de fechar atual; ícone, foco e
  `aria-label` devem refletir “fechar” e “abrir” sem perder semântica.
- A posição e o offset de 24 px permanecem como estão. O tamanho não altera
  `floatingPosition`.
- Em modo inline, os campos ficam salvos, mas não são renderizados. O editor
  deve explicar que esses controles valem somente para o widget flutuante.

## Impacto de implementação

1. Adicionar picker de cor, slider em passos de 4 px e seleção de ícone na seção
   Style. Indicar quando `avatar` não está disponível.
2. Estender defaults, schema e limites do formulário; propagar os valores locais
   para o preview e o PATCH dirty.
3. Atualizar `ChatConfig` na API web, domínio e widget; validar cor, enum e
   inteiro no backend e no domínio.
4. Adicionar colunas nullable `TEXT`, `INTEGER` e `TEXT` na migração.
5. Incluir os campos no presenter público e aplicar defaults em
   `resolveChatConfig`.
6. Substituir classes fixas do botão no widget por estilos derivados da
   configuração. Manter foco visível, hover, área de toque e atributos ARIA.

## Fallback e compatibilidade

Campos ausentes ou `null` mantêm o launcher atual. A cor inválida não deve ser
aplicada. Ícone `avatar` sem imagem cai para `chat`. Em valores de tamanho fora
do intervalo, backend e domínio rejeitam o PATCH; o widget usa 56 px para dados
ausentes durante a transição entre versões.

## Critérios de aceite

- Cor, tamanho e ícone atualizam o preview imediatamente e persistem por bot.
- O tamanho permitido é inteiro de 48 a 72 px, em passos de 4.
- Os três ícones locais funcionam sem recursos externos; avatar usa a imagem já
  existente e tem fallback documentado.
- O contraste do ícone, o foco de teclado e os nomes acessíveis continuam
  funcionais nos estados aberto e fechado.
- O layout de embed preserva margem e posição para todos os tamanhos.
- O botão não aparece no modo inline.

## Validação prevista

Cobrir posições esquerda/direita, extremos de tamanho, cor clara/escura, avatar
ausente/com erro, estado aberto, teclado, leitor de tela, viewport de 320 px e
modo inline. Confirmar que a área clicável não é menor que 44×44 px.

## Riscos e decisões restantes

O tamanho máximo pode encostar no limite da viewport quando combinado ao offset
existente. O widget deve limitar o host à largura disponível e manter uma margem
mínima de 16 px. A faixa sugerida de 48–72 px é adequada para toque; alterar
somente se o design validar que o launcher grande não encobre conteúdo.
