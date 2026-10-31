# Spike: persistência, autosave e contrato público da configuração do chat

## Status

Discovery concluído. Proposta pronta para implementação, com duas decisões
técnicas de baixo impacto ainda pendentes.

## Problema

O widget possui valores fixos para avatar, textos, cores, mensagem inicial,
timestamps e botão. O `Bot` ainda não possui configuração de chat, e o widget
não consulta uma configuração pública antes de renderizar.

## Hipótese

Adicionar uma configuração de chat ao agregado `Bot`, expor uma API autenticada
para edição incremental e uma API pública somente leitura para o widget.
O preview do painel usará o estado local do formulário imediatamente; a
persistência ocorrerá após o debounce.

## Decisões de produto

- Um bot possui uma única configuração compartilhada por todos os deployments.
- Cada alteração deve ser salva automaticamente, sem botão de submit.
- Campos opcionais vazios serão enviados e persistidos como `null`.
- `null` não significa ausência de comportamento: o runtime aplica o default.
- O widget deve continuar funcionando com defaults se a API pública falhar.
- O botão `Clear` é permitido somente no modo de teste.
- O modo de teste deve ser explícito no script/props do widget.
- Não haverá versionamento de configuração nesta primeira versão.

## Contrato candidato

### Configuração persistida no bot

```ts
type ChatConfig = {
  avatarUrl: string | null;
  inputPlaceholder: string | null;
  submitButtonText: string | null;
  showMessageTimestamps: boolean;
  starterQuestions: string[];
  generateStarterQuestionsAfterResponse: boolean;
  initialMessage: string | null;
  headerStatusText: string | null;
  chatBackgroundColor: string | null;
  headerFooterBackgroundColor: string | null;
  assistantMessageBackgroundColor: string | null;
  userMessageBackgroundColor: string | null;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  maxMessagesPerDay: number | null;
  maxUserMessagesPerConversation: number | null;
};
```

`starterQuestions` deve ser limitado a três itens e as configurações de modelo
e limite são detalhadas nas spikes específicas.

### Defaults efetivos

Quando o valor persistido for `null`, o runtime deve aplicar estes defaults:

| Campo | Default |
| --- | --- |
| `avatarUrl` | fallback visual `🤖` |
| `inputPlaceholder` | `Type your message...` |
| `submitButtonText` | `Send` |
| `showMessageTimestamps` | `false` |
| `initialMessage` | `Hello! 👋 How can I help you today?` |
| `headerStatusText` | `We are online` |
| cores | valores visuais atuais do widget |
| `model` | modelo default do catálogo |
| `temperature` | default do modelo |
| `maxTokens` | default do modelo |
| limites | ilimitado (`null`) |

O texto `Stop` não é configurável: durante a geração o botão normal é
substituído por um ícone de parada com `aria-label` acessível.

### API autenticada

Criar uma operação específica de chat, sem reutilizar o `EditBotInput` atual:

```text
PATCH /organization/:orgSlug/bots/:botSlug/chat-config
```

O corpo deve aceitar atualização parcial para permitir autosave por seção/campo.
O schema deve rejeitar propriedades desconhecidas e validar cada campo no
backend. O caso de uso deve carregar o `Bot`, aplicar suas regras e persistir o
estado atualizado.

### API pública

```text
GET /public/chat/:deploymentKey/config
```

A resposta deve conter somente dados necessários ao widget. Nunca retornar
credenciais, regras internas, dados da organização ou configuração de storage.
O widget deve usar `cache: "no-store"` ou política equivalente durante a
primeira versão para que alterações salvas apareçam após recarregar o widget.

## Autosave

Fluxo esperado:

1. O usuário altera o formulário.
2. O preview local é atualizado imediatamente.
3. O debounce reinicia.
4. Após o debounce, o hook envia somente o patch necessário.
5. O painel mostra estado de salvamento.
6. Em sucesso, o estado salvo substitui o snapshot anterior.
7. Em erro, os valores locais permanecem e uma nova alteração pode tentar
   novamente.

Recomendação inicial: debounce de 700 ms. O valor deve ser uma constante de
infraestrutura da feature, não uma opção apresentada ao usuário.

O hook não deve chamar `fetch` diretamente. A operação deve ficar em
`apps/web/src/api/bots/`, e a mutation/debounce deve ficar em hook da feature.

## Riscos e investigação

- Duas alterações podem terminar fora de ordem; a mutation precisa evitar que
  uma resposta antiga sobrescreva um valor mais novo.
- A configuração pública precisa aplicar defaults no widget, no backend ou em
  ambos. A fonte normativa deve ser definida para evitar divergência.
- Se o modo de teste for inferido apenas por `displayMode`, uma instalação
  pública inline ganhará o botão `Clear` indevidamente.

## Critérios de aceite

- Alterar qualquer campo atualiza o preview sem esperar a rede.
- O backend persiste a alteração após o debounce.
- Não existem botões de salvar nas seções da configuração.
- Valores opcionais vazios são persistidos como `null`.
- O widget público obtém a configuração pelo `deploymentKey`.
- Falha na API de configuração não impede o chat de funcionar com defaults.
- O botão `Clear` aparece somente quando o modo de teste estiver explicitamente
  ativo.
- Uma resposta antiga do autosave não pode sobrescrever uma alteração mais
  recente.
- O contrato público não expõe dados privados.

## Pendências

1. Confirmar se 700 ms será o debounce final.
2. Escolher o nome do atributo/prop explícito do modo de teste, por exemplo
   `mode="test"`.
