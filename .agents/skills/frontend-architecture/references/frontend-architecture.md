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

## API e server state

Chamadas HTTP diretas devem ficar em `src/api` da aplicação que possui o contrato. Cada operação HTTP deve ter seu próprio arquivo. Esses módulos podem validar respostas e declarar os contratos necessários, mas não podem importar React nem TanStack Query.

Hooks TanStack Query devem consumir os módulos de API. Eles são responsáveis por `queryOptions`, query keys, `useQuery`, `useMutation` e invalidações relacionadas ao server state. Componentes não devem chamar `fetch` nem configurar queries ou mutations diretamente; devem consumir os hooks da aplicação.

Hooks de roteamento e UI, como `useMatchRoute`, não pertencem à camada de server state. Eles devem permanecer separados e podem continuar diretamente nos componentes do layout que os utilizam.

SDKs externos, como Better Auth, permanecem em seus próprios clientes até que uma migração explícita seja solicitada. Essa regra evita misturar operações do SDK com a camada de API HTTP da aplicação.

Não é necessário criar pastas vazias antecipadamente. Crie a pasta quando houver código daquela responsabilidade.

## Estados de consultas assincronas

Toda consulta assincrona que renderiza dados do servidor deve tratar explicitamente os estados de carregamento e erro:

- enquanto `isPending`/`isLoading` estiver ativo, renderize um componente de loading usando o `Skeleton` adotado pelo projeto;
- o Skeleton deve preservar a hierarquia visual do conteúdo quando esses elementos existirem: use Skeleton somente para valores vindos da requisição, mantenha visíveis títulos, subtítulos, labels e hints estáticos e preserve botões/controles no mesmo lugar com seus textos estáticos visíveis durante o loading;
- enquanto `isError` estiver ativo, renderize um componente de erro dedicado;
- consultas que retornam coleções ou opções devem ter também um estado vazio dedicado quando a resposta bem-sucedida não tiver itens; isso vale para tabelas, listas, cards, `Select` e comboboxes, mantendo vazio, loading e erro como estados distintos;
- um `Select` ou combobox cujas opções vêm de uma consulta deve mostrar uma mensagem/componente de vazio quando não houver opções, em vez de renderizar um menu silenciosamente vazio;
- quando a consulta oferecer `refetch`, o componente de erro deve permitir tentar novamente;
- nao deixe a pagina, tab, painel ou lista vazia durante o carregamento ou depois de uma falha;
- diferencie erro, carregamento e estado vazio sem dados: cada um deve ter sua propria representacao.

Os componentes de loading e erro devem ficar na pasta mais proxima de onde sao usados. Em uma rota, prefira a pasta local da feature, como `src/routes/some-page/-components/`, com nomes descritivos como `some-page-skeleton.tsx` e `some-page-error.tsx`. So mova esses componentes para uma pasta comum quando houver reutilizacao real por multiplos consumidores.

Ao alterar uma consulta existente, complete os estados ausentes quando eles fizerem parte da area afetada; nao introduza novos consumidores que renderizem apenas o estado de sucesso.

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

`packages/ui` não deve conter API específica de `apps/web` ou `apps/widget`. Contratos HTTP, clientes de API e hooks de server state permanecem na aplicação que os consome, a menos que exista reutilização real entre aplicações e uma extração explícita para um package adequado.

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
