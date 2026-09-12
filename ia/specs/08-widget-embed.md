# Etapa 8 — Widget incorporável

## Objetivo

Entregar um script pequeno para sites de clientes que inicializa um chat dentro de iframe isolado, com autorização por origem e token efêmero.

## Dependências

- Etapas 1 a 7 concluídas.

## Snippet

Exemplo de instalação:

```html
<script
  async
  src="https://app.example.com/embed/v1/widget.js"
  data-bot-key="bt_live_public_key"
></script>
```

A chave identifica uma instalação, não é segredo. Não incluir `botId` ou `organizationId` no snippet.

## Por que usar script + iframe

- iframe impede que CSS do site quebre o widget;
- script controla botão, posição, abertura e resize;
- aplicação do iframe pode evoluir sem o cliente atualizar snippet;
- comunicação ocorre por `postMessage` com origem validada.

## Handshake seguro

Requisições feitas dentro do iframe têm como origem a própria plataforma, não o site pai. Portanto, validar apenas CORS do chat não comprova o domínio onde o widget foi instalado.

Fluxo:

1. `widget.js` executa no site do cliente.
2. O script chama:

```text
POST /api/embed/v1/session
Origin: https://cliente.example
```

```json
{ "publicKey": "bt_live_..." }
```

3. O server:
   - localiza o hash da chave;
   - exige instalação ativa e bot ativo;
   - compara o header `Origin` com `allowed_origins`;
   - aplica rate limit;
   - emite token assinado, aleatório ou JWT, com expiração curta.
4. O script cria o iframe sem colocar o token na query string.
5. Após o iframe sinalizar `ready`, o script envia o token por `postMessage`.
6. O iframe mantém o token somente em memória e o usa no endpoint de chat.

Claims mínimos:

```json
{
  "aud": "embed",
  "installationId": "uuid",
  "botId": "uuid",
  "organizationId": "text",
  "origin": "https://cliente.example",
  "exp": 0,
  "jti": "uuid"
}
```

Se usar token opaco, armazená-lo no Redis com TTL. Se usar JWT, assinar com segredo exclusivo do embed e validar audience, expiry e origin. A escolha recomendada para o MVP é JWT curto de 5 minutos, renovado silenciosamente pelo script enquanto a página estiver aberta.

## Rotas públicas

- `GET /embed/v1/widget.js`: loader versionado e cacheável.
- `POST /api/embed/v1/session`: handshake no domínio do cliente.
- `GET /embed/v1/frame`: aplicação pública do iframe.
- `POST /api/embed/v1/chat`: SSE autenticado pelo token.
- `GET /api/embed/v1/config`: configuração pública do bot autenticada pelo token.

O loader deve ser estável e pequeno. Assets internos do iframe podem receber hash e cache longo.

## CORS

O CORS global atual aceita apenas `CLIENT_ORIGIN`; as rotas embed precisam política separada:

- session: origem deve corresponder à allowlist da instalação;
- chat/config: origem da própria aplicação do iframe e token obrigatório;
- rotas privadas: continuam aceitando somente o app web autenticado.

Não usar `Access-Control-Allow-Origin: *` em endpoints privados.

## `postMessage`

Tanto script quanto iframe devem:

- validar `event.origin`;
- validar schema de cada mensagem;
- usar namespace/versionamento, por exemplo `training-ia:v1`;
- nunca aceitar HTML arbitrário;
- não usar `targetOrigin="*"`, exceto no primeiro sinal sem dado sensível se estritamente necessário.

Eventos:

- `frame-ready`;
- `session-token`;
- `open`;
- `close`;
- `resize`;
- `unread-count`;
- `session-refresh-required`.

## Interface do widget

MVP:

- launcher;
- header com nome/avatar;
- lista de mensagens apenas em memória;
- input e envio;
- streaming incremental;
- loading, retry e offline;
- citações;
- botão fechar;
- responsivo para mobile.

Configuração pública permitida:

- cor principal;
- título;
- mensagem inicial;
- avatar;
- posição esquerda/direita;
- label do launcher.

Sanitizar valores e aplicar allowlist. Não aceitar CSS ou JavaScript arbitrário.

## Privacidade

- Não usar cookies de autenticação do painel.
- Não persistir transcript.
- Recarregar a página apaga o histórico.
- Explicar esse comportamento no painel.
- Não armazenar token em `localStorage`, URL ou logs.
- Headers devem impedir frame do painel privado; somente a rota pública do widget pode ser incorporada.

Configurar CSP específica para o frame e `frame-ancestors` compatível com as origens autorizadas quando operacionalmente viável. Como a allowlist varia por instalação, avaliar CSP dinâmica por resposta.

## Proteção contra abuso

- Rate limit por instalação + IP.
- Limites por minuto e por dia configuráveis.
- Tamanho máximo de payload.
- Tempo máximo de stream.
- Instalação revogada impede renovar sessão imediatamente.
- Tokens antigos expiram em até 5 minutos.
- Nunca tratar a public key como segredo suficiente.

## Versionamento

- URL do loader contém versão major `/embed/v1/widget.js`.
- Mudanças compatíveis não exigem novo snippet.
- Mudanças incompatíveis criam `/v2`.
- Mensagens `postMessage` também carregam versão.

## Critérios de aceite

- Snippet funciona em uma página HTML externa.
- CSS do cliente não altera o conteúdo do iframe.
- Origem não autorizada não consegue criar sessão.
- Copiar a public key para outro domínio não concede chat.
- Token não aparece em URL, storage ou logs.
- Revogar instalação bloqueia novas sessões.
- Streaming, citações, cancelamento e retry funcionam.
- Widget funciona em desktop e mobile.
