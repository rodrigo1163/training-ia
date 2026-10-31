# Spike: modelo, parâmetros de geração e limites de mensagens

## Status

Discovery concluído. Proposta pronta para implementação, com catálogo e
fallback recomendados registrados abaixo.

## Objetivo

Permitir selecionar um modelo permitido por bot, configurar parâmetros seguros
de geração e aplicar limites de mensagens tanto na interface quanto no backend.

## Modelos permitidos

- O administrador só poderá escolher modelos presentes em uma lista permitida.
- A lista será declarada em uma variável/contrato compartilhado pelo backend e
  frontend.
- O frontend exibirá somente essa lista.
- O backend validará novamente o identificador recebido.
- Deve existir um modelo padrão para bots existentes e para `model: null`.
- O modelo principal recomendado é `anthropic/claude-sonnet-4.6`.
- O modelo secundário recomendado para starter questions é
  `anthropic/claude-haiku-5.5`.
- Os slugs devem ser configurados no catálogo, não espalhados pelo código.

O backend atual cria `ChatOpenAI` uma vez usando `OPENROUTER_CHAT_MODEL`. Para
suportar modelo por bot será necessário um factory/cache que receba o modelo
selecionado e os parâmetros do bot em runtime. A camada de domínio deve
continuar dependendo de `ChatModel`, não de LangChain ou OpenRouter.

## Parâmetros

```ts
type ChatGenerationConfig = {
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
};
```

Regras:

- `model: null` usa o modelo default.
- `temperature: null` usa o default do modelo.
- `temperature` aceita de `0` a `2`.
- `maxTokens: null` usa o limite padrão do modelo.
- O backend precisa validar `maxTokens` conforme o modelo selecionado quando o
  catálogo fornecer esse limite.
- Os parâmetros da resposta principal e da geração de sugestões devem ser
  independentes; a geração de sugestões usará o modelo secundário do catálogo.

O adaptador OpenAI-compatible suporta `model`, `temperature` e `configuration`
com `baseURL`; a compatibilidade de cada parâmetro ainda precisa ser validada
por modelo no catálogo antes de exibir o controle ao usuário.

## Fallback

Se o modelo selecionado estiver temporariamente indisponível:

- usar o modelo default;
- registrar o erro e o modelo originalmente escolhido;
- manter a resposta como sucesso se o fallback responder;
- retornar erro ao usuário somente se o fallback também falhar.

O fallback não deve mascarar erro de validação ou de autorização do modelo.

## Limite diário por bot

- O limite é por bot.
- Abrange todas as conversas desse bot.
- Conta somente mensagens aceitas do usuário.
- É reiniciado por dia em UTC.
- Mensagens `PENDING`, `STREAMING`, `COMPLETED` e `FAILED` são consideradas
  depois que a mensagem foi aceita pelo backend.
- `STOPPED` também consome o limite quando a mensagem do usuário já foi aceita.
- Mensagens iniciais do assistente e sugestões não contam.
- `null` significa ilimitado.

O incremento deve ser protegido contra concorrência. A implementação não pode
depender apenas de contar linhas depois de receber a requisição, porque duas
requisições simultâneas podem ultrapassar o limite.

## Limite por conversa

- O limite é por conversa.
- Conta somente mensagens aceitas do usuário.
- Mensagens iniciais do assistente e sugestões não contam.
- Estados aceitos pelo backend contam mesmo se a resposta depois falhar ou for
  interrompida.
- `null` significa ilimitado.
- Ao atingir o limite, retornar erro de domínio específico.

No ambiente de teste, o painel pode oferecer `Clear` para iniciar outra
conversa. No widget público, o usuário não terá botão de reset; refresh da
página inicia outra conversa local.

## Mensagens de limite

Mensagens sugeridas:

```text
Este bot atingiu o limite diário de mensagens. Tente novamente amanhã.
Esta conversa atingiu o limite de mensagens. Inicie uma nova conversa para continuar.
```

O frontend deve reconhecer os códigos de erro e exibir essas mensagens sem
depender de comparação com texto livre.

## Histórico e contexto

O limite de mensagens da conversa é uma regra de produto e não substitui o
limite técnico do histórico enviado ao modelo.

Na primeira versão:

- continuar enviando no máximo as últimas 20 mensagens ao modelo;
- manter esse limite separado do limite máximo de mensagens da conversa;
- não expor o tamanho do histórico técnico como configuração do usuário;
- usar `maxTokens: null` até existir uma política por modelo.

## Critérios de aceite

- O frontend só mostra modelos permitidos pelo catálogo compartilhado.
- O backend rejeita modelos fora do catálogo.
- Bots existentes continuam funcionando com o modelo default.
- O modelo é escolhido por bot sem depender exclusivamente de variável de
  ambiente global.
- Temperatura e máximo de tokens são opcionais.
- O fallback para o modelo default funciona somente em falhas de disponibilidade.
- O limite diário é isolado por bot e reiniciado em UTC.
- O limite por conversa é aplicado no backend e refletido no frontend.
- Concorrência não permite ultrapassar os limites.
- O histórico técnico continua limitado a 20 mensagens.

## Pendências

1. Confirmar os valores máximos permitidos para limite diário e limite por
   conversa.
2. Confirmar se o catálogo terá apenas nomes ou também metadados como contexto,
   custo e suporte a temperatura/max tokens.
