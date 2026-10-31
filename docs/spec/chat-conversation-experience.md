# Spike: experiência da conversa, mensagem inicial e starter questions

## Status

Discovery concluído. Proposta pronta para implementação, com uma decisão sobre
o modelo secundário ainda pendente.

## Objetivo

Configurar a primeira mensagem do chat, timestamps, sugestões iniciais e
sugestões geradas após respostas sem quebrar o fluxo atual de streaming.

## Mensagem inicial

- A mensagem inicial configurada será persistida como mensagem `ASSISTANT`.
- Ela será mostrada quando uma conversa for criada.
- Ela será incluída no histórico enviado ao modelo.
- Se estiver `null`, usar:

```text
Hello! 👋 How can I help you today?
```

- O botão `Clear` somente existirá no ambiente de teste.
- O `Clear` cancela a requisição atual, inicia uma conversa local nova e mostra
  novamente a mensagem inicial.
- No widget público, não haverá botão para limpar a conversa. Um refresh cria
  uma nova conversa local.
- O texto customizado do botão vale somente para o estado normal de envio.
- Durante a geração, o botão mostra um ícone de parada e mantém um
  `aria-label` equivalente a `Stop generating response`.

O modo de teste precisa ser explícito. Não usar apenas `displayMode="inline"`
como sinal, pois um deployment público também pode ser inline.

## Timestamps

- O checkbox padrão será desativado.
- Quando ativado, todas as mensagens exibem timestamp.
- O formato será baseado no horário local do visitante.
- Usar `hour12: true`, produzindo formato como `12:24 PM`.
- O timestamp da mensagem da IA será o momento em que o primeiro delta da
  resposta chegar ao widget.
- A mensagem inicial receberá timestamp no momento em que for exibida/criada.
- Mensagens interrompidas e falhas mantêm o timestamp já atribuído.

O contrato de `WidgetMessage` deverá carregar timestamp; o widget não deve
inferir timestamps a partir da ordem visual das mensagens.

## Starter questions configuradas

- Até três perguntas configuradas pelo administrador.
- Podem ser escritas livremente, sem obrigatoriedade de idioma do bot.
- Uma sugestão vazia ou duplicada deve ser rejeitada.
- Duplicidade será calculada após `trim`, lowercase e normalização de espaços.
- Ao clicar, a pergunta é enviada imediatamente.
- Enquanto houver geração ativa, as sugestões ficam desabilitadas.
- As sugestões aparecem no estado inicial e também após respostas.

Recomendação para não quebrar o layout: máximo de 120 caracteres por pergunta,
com quebra de linha controlada e sem truncar o texto enviado.

### Implementação do formulário

O formulário deve usar `useFieldArray` do React Hook Form com uma estrutura de
objetos, por exemplo:

```ts
type StarterQuestionField = { value: string };
type FormValues = { starterQuestions: StarterQuestionField[] };
```

Cada linha deve usar `field.id` como chave React. O botão de adicionar deve
usar `append({ value: "" })`, com o objeto completo, e nunca usar o índice como
chave visual. O padrão já existe no formulário de allowed origins em
`bot-embed.tsx`.

A validação de quantidade, vazio, tamanho e duplicidade deve ocorrer no
frontend para feedback imediato e no backend para proteger o contrato.

## Geração de novas sugestões

Quando `generateStarterQuestionsAfterResponse` estiver ativo:

1. o usuário clica em uma sugestão;
2. a pergunta é enviada normalmente;
3. a resposta principal é transmitida por streaming;
4. após a resposta, uma segunda chamada é feita para um modelo específico de
   sugestões;
5. a chamada recebe a pergunta usada, a resposta atual e o conjunto de textos
   já usados na conversa;
6. a IA gera uma nova sugestão;
7. somente o slot da sugestão clicada é substituído;
8. se a geração falhar, o slot fica sem sugestão;
9. a sugestão gerada é persistida na conversa.

A geração não deve produzir textos já usados na conversa após normalização.
Essa primeira versão evita duplicidade textual; detecção semântica fica fora do
escopo.

O gatilho confirmado é o clique em uma sugestão, pois somente esse fluxo possui
um slot conhecido para substituição. O comportamento depois de uma mensagem
digitada livremente precisa ser definido antes da implementação.

## Persistência das sugestões

As sugestões geradas pertencem à conversa, não à configuração permanente do
bot. O spike deve comparar:

- uma tabela `ChatConversationStarterQuestion`, com posição, texto, texto
  normalizado e estado usado;
- um campo JSON em `ChatConversation`.

A tabela dedicada é a opção preferida porque permite impor unicidade, manter o
estado de cada slot e consultar sugestões sem carregar um histórico inteiro.

## Segunda chamada de IA

A segunda chamada deve usar um modelo diferente do modelo principal, mas o
modelo exato ainda precisa ser definido. O contrato deve permitir que a chamada
seja desabilitada por configuração e que uma falha não marque a resposta
principal como falha.

O caso de uso deve manter essa chamada fora do controller e depender de um
contrato de aplicação para geração estruturada de sugestões. A resposta deve
ser limitada a uma pergunta válida por vez neste fluxo de substituição.

## Critérios de aceite

- A mensagem inicial é persistida e chega ao prompt como mensagem do assistente.
- `Clear` aparece somente no modo de teste.
- Refresh no widget público inicia nova conversa local.
- Timestamps aparecem em todas as mensagens quando habilitados.
- O horário usa timezone local e `hour12: true`.
- Existem no máximo três sugestões visíveis.
- Clique em sugestão envia imediatamente a pergunta.
- Sugestões ficam desabilitadas durante streaming.
- Apenas a sugestão clicada é substituída.
- A nova sugestão é gerada em segunda chamada e salva na conversa.
- Sugestões duplicadas normalizadas não são aceitas.
- Falha na segunda chamada não invalida a resposta principal.

## Pendências

1. Definir o modelo secundário para geração das sugestões.
2. Confirmar se 120 caracteres é o limite final por sugestão.
3. Escolher tabela dedicada ou JSON para persistir as sugestões da conversa.
4. Definir se a conversa e a mensagem inicial são persistidas no primeiro
   render do widget ou transacionalmente no primeiro envio do usuário. A
   recomendação é persistir no primeiro envio, antes da mensagem do usuário.
5. Definir se uma mensagem digitada livremente também dispara a geração de
   sugestões, já que não existe uma sugestão clicada para substituir.
