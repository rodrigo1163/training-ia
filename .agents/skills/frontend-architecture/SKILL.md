---
name: frontend-architecture
description: Apply the project's frontend placement and sharing rules when changing frontend applications or shared UI packages.
---

# Frontend architecture

Use this skill before modifying frontend code when deciding where a component, hook, helper, or type belongs, or when deciding whether code should be shared between applications.

The central rule is to keep code close to its consumers and promote it only when reuse is real:

```text
one consumer → local colocated folder
same feature or application → nearest common frontend folder
multiple frontend applications → shared frontend package
```

Read [references/frontend-architecture.md](references/frontend-architecture.md) before implementing or reviewing a frontend change. It defines the project's application boundaries, folder names, route colocation convention, shared-package boundary, and the relationship between `web` and `widget`.

Do not import an application's internal source into another application just to reuse behavior. If an application is consumed as a product artifact, use its public contract. If source-level components, hooks, or logic are shared, extract those parts into an appropriate frontend package.

For server communication in frontend applications, also follow these boundaries:

- Direct HTTP calls belong in `src/api`.
- Each HTTP operation belongs in its own module/file.
- API modules may contain request/response validation and contracts, but must not import React or TanStack Query.
- TanStack Query hooks consume API modules and own queries, mutations, query keys, and invalidations.
- Components must not call `fetch` or configure TanStack Query queries/mutations directly.
- Router/UI hooks such as `useMatchRoute` remain separate from the server-state layer and may stay with the layout components that use them.
- External SDKs such as Better Auth remain in their existing clients until an explicit migration is requested.
- `packages/ui` must not contain application-specific API modules.

For every asynchronous query that renders server data, the consuming feature must provide both states explicitly:

- a loading state built with the project's `Skeleton` component;
- an error state rendered by a dedicated error component, with retry when the query exposes `refetch`.

Do not leave the page, tab, panel, or list content blank while a query is pending or after it fails. Keep loading and error components in the closest folder to their consumer (for example, the route's `-components/` folder); promote them only when the same state component is actually reused by multiple consumers.
