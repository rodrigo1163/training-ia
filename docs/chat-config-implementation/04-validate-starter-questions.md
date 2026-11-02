# 04 — Validação das starter questions no frontend

## Objetivo

Validar as perguntas configuradas no formulário do playground antes do envio,
sem alterar backend, persistência ou streaming.

## Regras de validação

- As perguntas são opcionais e podem ter linhas vazias durante a edição.
- Cada linha preenchida aceita até 120 caracteres.
- Duplicidade usa `trim`, redução de espaços internos e lowercase.
- O formulário aceita no máximo três perguntas.
- O payload remove linhas vazias, aplica `trim()` e preserva a capitalização.

## Checklist

- [x] Erros aparecem no campo correspondente e impedem o submit.
- [x] O limite de três perguntas permanece no botão e no schema.
- [x] O preview local continua acompanhando a edição.
- [x] O salvamento continua condicionado ao botão `Save changes`.

## Decisões tomadas

- A duplicidade aponta para a segunda ocorrência, mantendo a primeira como
  referência válida.
- A normalização foi extraída para um helper puro local da feature.
- Linhas somente com espaços são tratadas como vazias e não geram erro.

## Pendências

- Não há pendências específicas desta atividade.
