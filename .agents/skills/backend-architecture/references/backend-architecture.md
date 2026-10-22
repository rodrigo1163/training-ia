# Arquitetura do backend

## Escopo

Estas regras se aplicam a:

- `apps/server/`;
- `apps/worker/`;
- `packages/core/`;
- `packages/contracts/`;
- `packages/database/`;
- `packages/storage/`;
- qualquer outro package compartilhado diretamente pelo server e pelo worker.

`packages/ui/` não faz parte destas regras de backend.

Não criar `packages/domain` apenas para centralizar entidades. Um conceito só deve ir para `packages/` quando for realmente compartilhado por server e worker e não depender de uma aplicação específica.

## Dependências

As dependências seguem esta direção:

```text
infra → application → enterprise → core
```

Regras:

- `enterprise` não importa NestJS, Prisma, HTTP, Redis, RabbitMQ, IA, storage ou classes de `infra`;
- `enterprise` pode usar as primitivas genéricas de `@training-ia/core`;
- `application` contém casos de uso, contratos de persistência e contratos de capacidades externas;
- `application` não importa implementações de `infra`;
- `infra` implementa contratos da aplicação e faz a composição do NestJS;
- controllers não acessam Prisma, Redis, RabbitMQ ou providers externos diretamente;
- mappers traduzem entre modelos externos e objetos de domínio;
- o schema Prisma e o cliente gerado pertencem à infraestrutura compartilhada em `packages/database`.

O uso de `@Injectable()` em casos de uso e contratos abstratos é permitido para integração com o NestJS. Isso não autoriza importar infraestrutura para dentro do domínio.

## Hierarquia das aplicações

O server e o worker devem seguir a mesma arquitetura-base:

```text
apps/<app>/src/
├── domain/
│   ├── enterprise/
│   │   ├── entities/
│   │   ├── events/
│   │   └── value-objects/
│   └── application/
│       ├── ai/
│       ├── content/
│       ├── messaging/
│       ├── repositories/
│       ├── storage/
│       ├── subscribers/
│       └── use-cases/
└── infra/
    ├── app.module.ts
    ├── ai/
    ├── auth/                 # quando aplicável
    ├── connections/
    ├── content/              # quando aplicável
    ├── database/
    ├── env/
    ├── events/               # módulos de composição de subscribers
    ├── http/                 # quando aplicável
    └── messaging/
```

Não usar uma pasta genérica `domain/application/services` para todos os contratos. Organize cada contrato diretamente por capacidade:

- `application/ai/`: modelos de chat, embeddings e outros contratos de IA;
- `application/content/`: extração, divisão ou transformação de conteúdo;
- `application/messaging/`: publicação e consumo representados como capacidades da aplicação;
- `application/repositories/`: contratos de persistência e consultas;
- `application/storage/`: upload, download e remoção de objetos;
- `application/subscribers/`: handlers de eventos de domínio;
- `application/use-cases/`: orquestrações de uma intenção de negócio.

Não criar `ports/` como camada adicional. As pastas de capacidade dentro de `application` já são os contratos da aplicação.

Implementações concretas ficam em `infra` na pasta correspondente. Exemplos:

```text
domain/application/ai/embedding-generator.ts
infra/ai/openrouter-embedding-generator.ts

domain/application/content/website-text-extractor.ts
infra/content/cheerio-website-text-extractor.ts

domain/application/storage/uploader.ts
infra/http/storage/r2-storage.ts
```

Contratos usados como token de injeção do NestJS devem ser `abstract class`, porque interfaces TypeScript não existem em runtime. Interfaces e types continuam apropriados para dados de entrada, saída e estruturas internas.

## Packages compartilhados

### `packages/core`

Contém primitivas reutilizáveis e independentes de negócio:

- `Entity`;
- `AggregateRoot`;
- `ValueObject`;
- `UniqueEntityId`;
- `Either`;
- eventos e infraestrutura genérica de eventos;
- tipos genéricos, como paginação;
- erros genéricos, como recurso não encontrado ou operação não permitida.

Não colocar em `core` erros específicos de bot, documento ou chat. `BotAlreadyExistsError` e `BotNotEmptyError`, por exemplo, pertencem à aplicação do server e devem ser tratados como legado a ser reorganizado.

### `packages/contracts`

Contém contratos de comunicação entre processos, especialmente mensagens compartilhadas entre server e worker:

- payloads RabbitMQ;
- payloads Redis;
- nomes de canais e estados transmitidos;
- tipos que precisam ser idênticos nos dois processos.

Não colocar aqui entidades, casos de uso ou portas específicas de uma aplicação.

### `packages/database`

Contém schema, migrations, cliente Prisma e utilitários de conexão compartilhados. Regras de negócio não devem depender diretamente do schema Prisma.

### `packages/storage`

Contém adaptadores de storage que podem ser usados por mais de uma aplicação. A aplicação ainda deve depender de seu contrato em `domain/application/storage`.

## Enterprise

### Entity

Use `Entity` quando o objeto possuir identidade própria e continuidade durante seu ciclo de vida. A identidade é mais importante que a igualdade dos valores.

Padrão esperado:

```ts
export interface ExampleProps {
  // estado da entidade
}

export class Example extends Entity<ExampleProps> {
  get field() {
    return this.props.field;
  }

  static create(
    props: Optional<ExampleProps, 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    return new Example(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
```

Use `static create` para defaults, normalização necessária à criação e eventos emitidos no nascimento da entidade.

### AggregateRoot

Use `AggregateRoot` quando a entidade for a porta de entrada de um limite de consistência ou precisar publicar eventos de domínio. Não transformar toda tabela Prisma em agregado apenas por existir no banco.

Classificações atuais/provisórias:

- `Document` é `AggregateRoot`;
- `DocumentContent` é uma entidade interna do agregado `Document`;
- `ChatConversation` e `ChatMessage` são agregados separados;
- `ChatMessageCitation` pertence ao ciclo de vida da mensagem e não é agregado raiz;
- `ProcessingDocument` do worker é uma projeção de processamento, não uma entidade DDD completa;
- `Bot`, `BotDeployment`, `Organization` e `OrganizationMember` devem ser classificados conforme seus limites de consistência e eventos, não apenas pela tabela correspondente.

O chat não deve carregar todas as mensagens dentro de `ChatConversation`: o histórico é potencialmente ilimitado e a mensagem possui transições próprias durante streaming. O relacionamento é feito por identidade (`conversationId`), e o fluxo transacional de criação de turno pode continuar em um contrato específico de aplicação.

### Setters e comportamento

Setters são o padrão para edições simples:

```ts
bot.name = name;
bot.description = description;
```

Quando uma alteração atualiza `updatedAt`, o setter deve chamar `touch()`.

Use métodos quando houver uma transição, validação ou efeito de domínio:

```ts
document.startProcessing();
document.updateContent(content, textHash);
chatMessage.markStreaming();
chatMessage.complete(content, model);
```

O caso de uso de edição deve buscar a entidade, validar a autorização, aplicar setters na instância carregada e persistir essa instância. Não recriar uma cópia da entidade apenas para editá-la. O `EditBotUseCase` atual é uma exceção legada e deve ser tratado como fora do padrão.

Setters não substituem validações que precisam proteger invariantes. A validação deve continuar no setter, método de domínio ou value object adequado.

### Value objects e projeções

Use value objects para valores sem identidade própria, como `Slug`. Use objetos de leitura, como `DocumentDetails`, quando o retorno for uma composição para consulta e não uma entidade mutável do domínio.

Use uma lista observável, como `WatchedList`, quando um agregado possuir uma coleção limitada de entidades e precisar detectar itens adicionados/removidos. Não introduzir listas observáveis para históricos potencialmente ilimitados, como mensagens de chat.

Extraia uma classe-base apenas quando houver comportamento e propriedades realmente compartilhados, como o padrão `Comment` do projeto de referência. Não criar abstrações apenas para reduzir repetição visual.

Mantenha testes de entidades ao lado das entidades, no mesmo diretório, com o sufixo `.spec.ts`.

## Eventos e subscribers

Eventos de domínio pertencem a:

```text
domain/enterprise/events/
```

Subscribers pertencem a:

```text
domain/application/subscribers/
```

O diretório `infra/events` deve conter módulos Nest de composição e wiring dos subscribers, não a lógica do subscriber.

O subscriber atual do processamento de documentos deve ser temporariamente nomeado `on-document-created.ts` / `OnDocumentCreated`, conforme a convenção decidida pelo projeto, embora o evento consumido ainda seja `DocumentProcessingRequestedEvent`. Essa diferença semântica é uma dívida conhecida; não copiar o nome para novos fluxos sem confirmar o significado do evento.

Subscribers devem ter teste unitário próprio, usando doubles para o publisher ou caso de uso chamado. O teste deve verificar que o evento produz a chamada esperada.

## NestJS e composição de módulos

`AppModule` é o composition root e deve ser pequeno. Ele importa módulos de alto nível, por exemplo:

```ts
@Module({
  imports: [EnvModule, AuthModule, HttpModule, DatabaseModule, EventsModule],
})
export class AppModule {}
```

Evitar registrar todos os controllers, casos de uso e implementações concretas diretamente no `AppModule`.

### `HttpModule`

`infra/http/http.module.ts` registra controllers e casos de uso usados pela entrada HTTP e importa os módulos de infraestrutura necessários, como database e storage.

### `DatabaseModule`

Registra Prisma e implementações de repositórios. Exporta os tokens abstratos dos repositórios, não obriga a camada de aplicação a conhecer Prisma.

### `EventsModule`

Registra subscribers e as implementações de messaging necessárias para eles. O subscriber fica na aplicação; o publisher concreto fica na infraestrutura.

## HTTP

Cada controller deve representar exatamente um endpoint.

Cada controller deve:

- possuir um único decorator de método HTTP;
- ter seu próprio schema Zod no próprio arquivo;
- validar entrada com `ZodValidationPipe`;
- obter parâmetros e contexto HTTP;
- chamar um único caso de uso principal;
- converter erros de aplicação em exceções HTTP;
- usar presenter quando houver transformação da resposta.

Controllers podem lidar com preocupações de transporte, autenticação, guards, upload, schema e status HTTP. Regras de negócio, autorização específica do recurso e transições de entidades pertencem ao caso de uso ou ao domínio.

### Mapeamento de erros

Quando houver apenas um caminho de erro HTTP, usar um `if` simples:

```ts
if (result.isLeft()) {
  throw new BadRequestException();
}
```

Quando tipos de erro diferentes precisarem de status HTTP diferentes, usar `switch`, seguindo o padrão existente:

```ts
if (result.isLeft()) {
  const error = result.value;

  switch (error.constructor) {
    case ResourceNotFoundError:
      throw new NotFoundException(error.message);
    case ConflictError:
      throw new ConflictException(error.message);
    default:
      throw new BadRequestException(error.message);
  }
}
```

Não criar um mapeador global de erros para substituir essa decisão local dos controllers. A exceção HTTP deve refletir o contrato daquele endpoint.

## Testes

### Controllers

Cada controller possui um arquivo e2e correspondente:

```text
create-bot.controller.ts
create-bot.controller.e2e-spec.ts
```

O teste e2e do controller deve ter:

- uma única suite `describe`;
- um único teste do caminho de sucesso do endpoint;
- asserções sobre resposta e efeito persistido relevante;
- setup/teardown compartilhado no próprio arquivo.

Não colocar cenários de erro ou múltiplos endpoints no teste e2e do controller, salvo decisão explícita para um fluxo que não possa ser coberto no use case.

### Use cases

Cada caso de uso possui seu próprio arquivo de teste:

```text
create-bot.ts
create-bot.spec.ts
```

Os testes de caso de uso devem usar repositórios em memória, fakes ou spies das portas. Um arquivo pode conter vários cenários e várias suites `describe` quando isso melhorar a organização, incluindo sucesso, erros de negócio, autorização e efeitos colaterais.

Não substituir testes unitários de use case por e2e. O e2e valida o contrato HTTP e o caminho de sucesso; o teste em memória valida a regra de negócio.

### Worker

O worker segue as mesmas regras de testes de entidades, portas e casos de uso. O consumidor de mensagem pode ter testes próprios de integração da entrada, mas a lógica de processamento deve permanecer testável pelo `ProcessDocumentUseCase` com fakes.

## Checklist de mudança

Antes de alterar o backend:

1. identifique se o código pertence a `enterprise`, `application` ou `infra`;
2. verifique se o contrato é específico da aplicação ou compartilhado entre server e worker;
3. mantenha implementações externas fora de `domain`;
4. verifique o agregado e suas invariantes antes de adicionar setters ou métodos;
5. mantenha um controller por endpoint e seu e2e de sucesso correspondente;
6. mantenha um spec por use case usando doubles em memória;
7. aplique `switch` apenas quando houver múltiplos mapeamentos de erro HTTP;
8. se uma regra existente estiver fora do padrão, registre a inconsistência e corrija-a somente se estiver dentro do escopo da tarefa;
9. rode `pnpm check-types`, `pnpm lint` e os testes relevantes; para mudanças de código, rode também `pnpm build` antes de concluir.
