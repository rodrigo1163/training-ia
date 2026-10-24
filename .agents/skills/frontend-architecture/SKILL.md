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
