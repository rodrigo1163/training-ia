# Regras do Server

## Stack
- Este app usa Fastify com TypeScript.
- Use `tsx` para desenvolvimento e `tsc` para build.
- Use `pnpm` para scripts e dependencias.

## Codigo
- Exporte a instancia da aplicacao por uma funcao `buildServer`.
- Mantenha a inicializacao HTTP em `src/index.ts`.
- Registre novas rotas e plugins a partir de `src/app.ts` ou modulos chamados por ele.
- Evite `any`; prefira tipos explicitos quando a inferencia nao for suficiente.

## Fastify
- Use APIs nativas do Fastify para rotas, plugins, validacao e hooks.
- Configure porta via `PORT` e host via `HOST`.
- Preserve uma rota simples de saude em `/health`.
- Quando houver duvida sobre APIs do Fastify, consulte o Context7 antes de implementar.

## Validacao
- Antes de finalizar mudancas no server, rode `pnpm --filter server check-types`.
- Rode `pnpm --filter server build` quando alterar codigo de runtime ou configuracao TypeScript.
