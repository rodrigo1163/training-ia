# 05 — Temas prontos de aparência

Status: proposta pronta para implementação.

## Objetivo

Permitir aplicar rapidamente uma combinação coerente de cores e depois editar
qualquer campo individualmente.

## Decisão de produto

Temas são atalhos de edição no playground, não uma segunda configuração de
runtime. Ao escolher um tema, o formulário preenche os campos de cor já
existentes e os campos introduzidos nas etapas anteriores. O preview muda na
hora e o submit atual persiste os campos dirty normalmente.

Não persistir `themePreset`, não criar endpoint e não adicionar coluna no banco.
O tema atual é inferido comparando os valores de cor com as paletas conhecidas;
se os valores não coincidirem, mostrar `Custom`. Isso evita divergência entre o
nome salvo e cores editadas manualmente.

## Presets iniciais

As paletas abaixo são candidatas e devem ser conferidas no preview com texto,
inputs, mensagens, sugestões, botão flutuante e borda. Campos de texto explícitos
devem ter contraste suficiente; `null` significa usar o cálculo de foreground
existente.

| Tema | Painel | Cabeçalho/rodapé | Mensagem do assistente | Mensagem do usuário | Borda / acento |
| --- | --- | --- | --- | --- | --- |
| Claro | `#ffffff` | `#f3f4f6` | `#f9fafb` | `#e5e7eb` | `#d1d5db` / `#0865cf` |
| Escuro | `#111827` | `#1f2937` | `#1f2937` | `#2563eb` | `#374151` / `#2563eb` |
| Marca | `#ffffff` | `#0865cf` | `#f6f8fc` | `#0865cf` | `#d1d5db` / `#0865cf` |

“Marca” reproduz a identidade visual base atual. Os valores finais podem mudar
após validação visual e de contraste, sem alterar a estrutura de presets.

## Escopo dos campos

Preset define apenas cores das superfícies, cores manuais do texto quando
necessárias, cor do input, sugestões, borda e launcher. Não muda largura, altura,
raios, sombra, posição, tamanho/ícone do launcher ou tipografia.
O nome do preset é uma descrição da paleta aplicada, não um modo que reage à
preferência de cor do visitante.

Adicionar ação `Default` para restaurar os valores base do widget: os campos que
aceitam cor vazia voltam a `null` e os campos exibidos como valor efetivo no
formulário voltam aos defaults existentes. Ela deve restaurar somente aparência,
sem apagar avatar, textos ou opções de layout.

## Comportamento do editor

- Selecionar Claro, Escuro, Marca ou Default aplica todos os campos da paleta em
  uma única ação de formulário e marca os campos afetados como dirty.
- Preview reflete a paleta imediatamente; o usuário salva no botão atual.
- Alterar uma cor depois da seleção muda o indicador para `Custom`.
- Voltar a todos os valores exatos de uma paleta seleciona seu nome novamente.
- Ao selecionar outro bot, o formulário e o preset inferido são recalculados a
  partir da configuração daquele bot.
- A ação de preset não deve substituir estado não salvo de campos alheios às
  cores.
- Mostrar aviso não bloqueante se um preset ou combinação manual tiver contraste
  abaixo dos limites indicados na etapa 01.

## Impacto de implementação

Esta etapa depende das cores de texto, launcher e borda já disponíveis. Criar um
catálogo local e tipado de presets no frontend; usar `setValue` do formulário
para os campos de cor e atualizar `dirtyFields`/validação de modo consistente.
Não alterar API, domínio, widget, presenter nem banco. Não enviar um campo
`themePreset` no PATCH.

## Critérios de aceite

- Existem três presets de cor e uma ação para restaurar defaults.
- Presets aplicam cores em superfícies, texto, input, sugestões, borda e launcher
  sem alterar geometria, avatar ou tipografia.
- Mudanças aparecem no preview antes de salvar e persistem pelo PATCH parcial.
- Alterações manuais mostram `Custom`; valores que correspondem a uma paleta
  voltam a exibir seu nome.
- A troca de bot não reaplica tema do bot anterior.
- Nenhum campo de preset é persistido separadamente.
- Avisos de contraste aparecem quando necessário.

## Validação prevista

Verificar cada preset em painel aberto, bolhas com mensagens longas, Markdown,
inputs, sugestões e widget flutuante; combinar com fonte, tamanho e borda; salvar,
recarregar e inferir preset; editar uma cor e observar `Custom`;
restaurar Default e confirmar que avatar e geometria não mudam.

## Dependências e decisões restantes

Depende das etapas 01, 02 e 03. Paletas são provisórias até serem verificadas
com a implementação real do contraste e dos defaults do widget. Não há requisito
de persistir metadados do tema.
