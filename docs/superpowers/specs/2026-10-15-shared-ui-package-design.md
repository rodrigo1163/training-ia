# Shared UI Package Design

## Objective

Move the existing shadcn/ui component set out of `apps/web` into a workspace package so the web application and the embeddable widget consume the same implementation, styling tokens, and `cn` helper.

The widget must use the shared package in real code, while the web application must preserve its current import surface and behavior during the migration.

## Existing context

- The repository is a pnpm workspace that currently includes only `apps/*`.
- `apps/web` already contains the generated shadcn/ui components under `src/components/ui`, a shadcn `components.json`, Tailwind v4, and the shared CSS variables in `src/global.css`.
- `apps/widget` is a Vite React application that renders both as a local page and as an IIFE inside a Shadow DOM.
- The widget currently owns plain CSS controls for its chat trigger, close button, send button, and text input.
- The web application has application-specific components, hooks, and `animate-ui` code that must not be moved into the shared package.

## Architecture

### Package boundary

Create a private workspace package named `@training-ia/ui` at `packages/ui`.

The package owns:

- all files currently under `apps/web/src/components/ui`;
- `cn` in `src/lib/utils.ts`;
- `use-mobile` in `src/hooks/use-mobile.ts`, because `sidebar` depends on it;
- the shadcn/Tailwind stylesheet and design tokens in `src/styles.css`;
- a root `src/index.ts` that exports every shared UI component and `cn`.

The package is source-based and does not introduce a new bundler or compiled distribution. Its exports point to TypeScript source files so Vite and TypeScript can tree-shake and bundle only the components each application imports.

The package exposes:

```text
@training-ia/ui
@training-ia/ui/styles.css
@training-ia/ui/components/ui/<component>
```

Internal component imports use relative package paths. No shared component may depend on an `@/*` alias belonging to `apps/web`.

### Web compatibility

The existing web import paths such as `@/components/ui/button` remain valid through thin re-export facades in `apps/web/src/components/ui`. The old implementation is removed from the web app, leaving only those facades. `apps/web/src/lib/utils.ts` re-exports `cn` from `@training-ia/ui` so existing application-specific code keeps working.

`apps/web/src/global.css` imports `@training-ia/ui/styles.css` and retains only web-specific CSS. The web package adds `@training-ia/ui` as a workspace dependency.

### Widget consumption

The widget adds `@training-ia/ui` as a workspace dependency and imports `@training-ia/ui/styles.css` at the beginning of its stylesheet. The widget Vite config enables the Tailwind v4 Vite plugin so the shared stylesheet generates utilities used by shared components.

`ChatWidget` uses the shared `Button` and `Input` components for its trigger, close/send controls, and message input. Existing widget-specific classes remain responsible for the widget layout, sizing, colors, and Shadow DOM presentation.

The IIFE path continues to inline the complete `widget.css`, including the shared stylesheet, into the Shadow DOM. The local development page continues to import the same stylesheet from `main.tsx`.

### Dependencies

`@training-ia/ui` declares the runtime libraries used by its components: React as a peer dependency, class-variance-authority, clsx, lucide-react, tailwind-merge, radix-ui, and the existing Base UI packages. Tailwind CSS, `tw-animate-css`, and `shadcn` are package dependencies because the shared stylesheet imports them.

The web app keeps its existing dependencies and adds only the workspace package. The widget adds the workspace package and the Tailwind Vite integration required to process the shared CSS. No new component library is introduced.

### Styling and source scanning

The shared stylesheet retains the current shadcn neutral theme, dark-mode variables, base rules, and animation definition. It explicitly registers the package source with Tailwind using `@source`, so utilities referenced by package components are generated even when the stylesheet is consumed from a workspace dependency.

Each consuming app keeps its own source scan entry. Widget-specific CSS is loaded after the shared stylesheet so existing widget selectors can intentionally override shared defaults inside the Shadow DOM.

## Public behavior

- Web UI behavior and import paths remain unchanged.
- The widget's current open/close, message, and submit behavior remains unchanged.
- Shared components remain typed React components with the same props and exports they currently expose in the web app.
- The package does not expose server-only code and does not access browser globals at module initialization, except for the existing hook behavior when rendered.
- The package is private to this monorepo; publishing to a registry is out of scope.

## Verification

The migration is accepted only when all of the following succeed:

```bash
pnpm --filter @training-ia/ui check-types
pnpm --filter web check-types
pnpm --filter @app/widget build
pnpm check-types
pnpm build
pnpm lint
```

The widget build must resolve `@training-ia/ui` and produce the IIFE bundle. The web build must resolve every compatibility facade and produce the existing TanStack Start output. `git diff --check` must report no new whitespace errors.

## Out of scope

- Replacing the widget's visual design.
- Moving application-specific `animate-ui` components, bot components, route components, or web-only utilities into `packages/ui`.
- Adding a component generator or changing `components.json` beyond documenting the new package location if required by the existing shadcn workflow.
- Publishing, versioning, or releasing `@training-ia/ui` outside this repository.
- Introducing a CSS-in-JS runtime or a second styling system.
