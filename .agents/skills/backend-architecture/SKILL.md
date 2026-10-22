---
name: backend-architecture
description: Apply the project's DDD and Clean Architecture rules when changing apps/server, apps/worker, or shared backend packages.
---

# Backend architecture

Use this skill before modifying any backend code under `apps/server`, `apps/worker`, or a package used by both applications.

The project uses NestJS with DDD and Clean Architecture. Preserve the dependency direction, keep business rules in the domain, and treat the current codebase as the source of local conventions.

Read [references/backend-architecture.md](references/backend-architecture.md) before implementing or reviewing a backend change. It defines the folder hierarchy, responsibilities, aggregate guidance, Nest module composition, HTTP error mapping, and test conventions.

When the existing code conflicts with these rules, preserve unrelated user changes and call out the conflict. Fix it only when the requested change includes the correction. Known legacy deviations currently documented by the project include the `EditBotUseCase` entity-copy pattern and the temporary `OnDocumentCreated` name for the document-processing subscriber.
