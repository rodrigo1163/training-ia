# Regras do App Web

## Stack
- Este app usa TanStack Start, TanStack Router, React e TypeScript.
- Use Vite conforme configurado em `vite.config.ts`.
- Use `pnpm` para scripts e dependencias.

## TanStack Start
- Use as convencoes de rotas em `src/routes`.
- Preserve arquivos gerados como `src/routeTree.gen.ts` conforme o fluxo do TanStack Router.
- Nao edite `src/routeTree.gen.ts` manualmente, exceto se for estritamente necessario.
- Para criar ou alterar rotas, edite os arquivos em `src/routes` e regenere a route tree quando necessario.
- Quando houver duvida sobre APIs do TanStack Start, TanStack Router ou Vite, consulte o Context7 antes de implementar.

## Codigo
- Prefira componentes pequenos e focados.
- Mantenha estilos globais em `src/styles.css` apenas quando forem realmente globais.
- Evite `any`; use tipos explicitos quando o TypeScript nao inferir bem.
- Nao adicione bibliotecas novas sem necessidade real.

## Validacao
- Antes de finalizar mudancas no app, rode `pnpm check-types`.
- Rode `pnpm build` quando alterar rotas, configuracao do Vite ou comportamento de runtime.
