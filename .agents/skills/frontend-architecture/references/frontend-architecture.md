# Arquitetura do frontend

## Escopo

Estas regras se aplicam a:

- `apps/web/`;
- `apps/widget/`;
- `packages/ui/`;
- outros packages frontend compartilhados que venham a ser adicionados ao monorepo.

Esta referência descreve a organização desejada para código novo e para alterações solicitadas. Ela não exige reorganizar código existente que não faça parte da tarefa.

## Regra de colocação

Comece sempre pela menor área que contém todos os consumidores do código:

1. Se um componente, hook, helper ou type tem um único consumidor, mantenha-o próximo da página ou componente que o utiliza.
2. Se vários arquivos da mesma feature ou aplicação usam o código, mova-o para o ancestral comum mais próximo.
3. Se mais de um frontend usa o código, extraia-o para um package frontend compartilhado.

Não coloque algo em uma pasta global apenas porque ele pode ser reutilizado no futuro. A promoção deve acontecer por reutilização real.

Exemplo de código específico de uma rota:

```text
src/routes/some-page/
├── route.tsx
├── -components/
├── -hooks/
├── -helpers/
└── -types/
```

Exemplo de código reutilizado por uma feature dentro de uma aplicação:

```text
src/components/bots/
├── components/
├── hooks/
├── helpers/
└── types/
```

Os nomes e a profundidade podem acompanhar a estrutura existente, mas a decisão de escopo deve seguir a proximidade dos consumidores.

## Responsabilidade das pastas

Separe cada responsabilidade em sua própria pasta quando ela existir:

- `components/`: componentes React e composição visual;
- `hooks/`: estado, efeitos e composição de comportamento React;
- `helpers/`: funções auxiliares, preferencialmente sem ciclo de vida React;
- `types/`: tipos e contratos usados por mais de um arquivo daquele escopo.

Um componente com lógica própria pode ser dividido em um componente, um hook, helpers e types, cada um em sua pasta correspondente. Não concentre todos esses papéis em um único arquivo nem crie abstrações apenas para reduzir repetição visual.

Não é necessário criar pastas vazias antecipadamente. Crie a pasta quando houver código daquela responsabilidade.

## Componentes compartilhados

Quando `web` e `widget` precisarem compartilhar componentes, hooks ou lógica React, extraia somente a parte compartilhada para `packages/ui` ou para outro package frontend cuja responsabilidade seja adequada.

O package compartilhado não deve importar código de `apps/web` ou `apps/widget`. Aplicações podem depender do package; o package não deve depender da implementação interna de uma aplicação.

Em `packages/ui`, organize o código por responsabilidade:

```text
packages/ui/src/
├── components/
├── hooks/
├── helpers/
└── types/
```

`packages/ui` pode conter componentes de produto quando eles forem realmente compartilhados pelos frontends e suas dependências fizerem sentido nesse package. Não mover código para lá apenas para antecipar reutilização. Quando o código tiver um domínio ou ciclo de vida independente da biblioteca visual, prefira um package frontend compartilhado com nome e responsabilidade próprios.

Para código novo, use `helpers/` para helpers compartilhados. O diretório `packages/ui/src/lib/` existente não deve ser migrado automaticamente; alterações de organização devem fazer parte de uma tarefa explícita.

## Relação entre `web` e `widget`

Há duas formas diferentes de reutilização:

### Consumo do widget como produto

Se o `web` precisa exibir ou executar o widget como um artefato, ele deve consumi-lo pelo contrato público do widget, como script, iframe ou bundle. O `web` não deve importar arquivos internos de `apps/widget` para simular esse consumo.

### Compartilhamento de código-fonte

Se `web` e `widget` precisam renderizar o mesmo componente ou usar a mesma lógica React, essa parte deve ser extraída para `packages/ui` ou outro package frontend compartilhado. O entrypoint, a configuração de build e o runtime específico do widget continuam em `apps/widget`.

Essa separação evita que uma aplicação se torne dependente da estrutura interna da outra e permite alterar o bundle do widget sem quebrar o `web`.

## Dependências e imports

Respeite a direção das dependências:

```text
aplicação → package frontend compartilhado
```

Não crie imports entre pastas internas de `apps/web` e `apps/widget` para contornar a ausência de um package compartilhado. Não coloque rotas, entrypoints, configuração de build ou integrações específicas de uma aplicação em `packages/ui`.

Ao adicionar um componente, hook ou helper compartilhado, mantenha-o acessível pelo contrato público já adotado pelo package e atualize os exports necessários. Evite depender de caminhos internos não documentados quando o package possui uma API pública.

## Diretriz de revisão

Ao revisar uma alteração frontend, verifique:

- o código está no menor escopo que atende aos consumidores atuais;
- a promoção para uma pasta comum foi motivada por reutilização real;
- componentes, hooks, helpers e types não estão misturados sem necessidade;
- nenhuma aplicação importa a implementação interna de outra;
- código compartilhado não depende de uma aplicação específica;
- a alteração não reorganiza código não relacionado sem necessidade.
