# Spikes: configuração do chat

## Objetivo

Investigar e decompor a implementação da configuração do chat em spikes
complementares. As decisões abaixo formam um único contrato de produto, mas
podem ser implementadas em etapas independentes.

## Status

Proposta consolidada após discovery. As pendências técnicas estão registradas
nas spikes individuais e não bloqueiam a definição dos contratos principais.

## Ordem de execução

1. [Persistência, autosave e contrato público](./chat-config-persistence.md)
2. [Aparência e avatar](./chat-appearance-and-avatar.md)
3. [Experiência da conversa e starter questions](./chat-conversation-experience.md)
4. [Modelo, parâmetros e limites](./chat-model-and-limits.md)

## Decisões transversais

- A configuração pertence ao `Bot`; todos os deployments do mesmo bot usam a
  mesma configuração.
- O formulário terá preview local imediato e autosave com debounce.
- Campos opcionais vazios serão persistidos como `null` e o runtime aplicará
  os defaults centralizados.
- A configuração pública será carregada pelo widget usando o `deploymentKey`.
- Se a consulta pública falhar, o widget continuará funcionando com defaults.
- O botão `Clear` existirá somente no ambiente de teste.
- O ambiente de teste será identificado explicitamente pelo contrato do
  widget; `displayMode="inline"` sozinho não é suficiente.
- A configuração pública não será versionada nesta primeira etapa.

## Dependências

- O backend continua seguindo `infra → application → enterprise → core`.
- O frontend mantém chamadas HTTP em `src/api`, server state em hooks e
  componentes próximos da feature.
- O widget não deve importar código interno do `apps/web`.
- A lista de modelos permitidos e os defaults precisam ser compartilhados
  entre backend e frontend por um contrato comum, sem duplicar strings em
  aplicações diferentes.

## Critério geral de saída

As quatro spikes individuais devem possuir contrato de dados, comportamento de
fallback, critérios de aceite e uma lista explícita de decisões restantes.
