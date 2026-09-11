# Regras do Projeto

## Stack
- Use `pnpm` como gerenciador de pacotes.
- Nao use `npm` ou `yarn` neste projeto.
- O app web fica em `apps/web` e usa TanStack Start.
- O server fica em `apps/server` e usa Fastify.

## Comandos
- Instalar dependencias: `pnpm install`
- Rodar em desenvolvimento: `pnpm dev`
- Validar tipos: `pnpm check-types`
- Validar lint: `pnpm lint`
- Gerar build: `pnpm build`

## Codigo
- Prefira TypeScript estrito.
- Evite `any`; use apenas quando houver justificativa clara.
- Siga os padroes ja existentes antes de criar novas abstracoes.
- Mantenha componentes React pequenos, legiveis e focados.
- Nao adicione novas bibliotecas sem necessidade real.

## Git
- Antes de commit, rode `pnpm check-types` e `pnpm build` quando a mudanca afetar codigo.
- Use mensagens de commit no formato conventional commits.
- Nao reverta alteracoes do usuario sem pedido explicito.
