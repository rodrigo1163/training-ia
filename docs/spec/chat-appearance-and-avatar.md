# Spike: aparência, cores e avatar do chat

## Status

Discovery concluído. Proposta pronta para implementação.

## Objetivo

Permitir personalizar a identidade visual do chat sem alterar o conteúdo das
mensagens nem depender de valores fixos no widget.

## Decisões de produto

- O avatar será opcional e poderá ser substituído ou removido.
- Formatos aceitos: PNG, JPG, JPEG e WebP.
- Tamanho máximo do arquivo: 2 MB.
- O arquivo original não poderá exceder 800 × 800 px.
- O resultado processado também deverá permanecer dentro de 800 × 800 px.
- O usuário escolherá o recorte antes de salvar.
- O avatar aparecerá no cabeçalho e ao lado das mensagens da IA.
- Sem avatar, o widget usará o fallback atual.
- O texto de status do cabeçalho será configurável e poderá ser removido.
- Serão configuradas quatro superfícies de cor:
  - fundo geral do chat;
  - fundo do cabeçalho e rodapé;
  - fundo das mensagens da IA;
  - fundo das mensagens do usuário.
- As cores aceitarão formatos CSS seguros equivalentes a hexadecimal, RGB e
  HSL. O backend deve validar a sintaxe antes de persistir.
- O texto das mensagens não será configurado manualmente nesta etapa. O
  foreground será calculado automaticamente para manter contraste.

## Hipótese técnica do avatar

O navegador faz a seleção e o recorte e envia o resultado processado ao fluxo
de upload do backend. O backend valida novamente o MIME, tamanho, dimensões e
conteúdo real do arquivo antes de usar o `Uploader` existente.

O avatar não deve ser armazenado como documento de conhecimento. Deve possuir
uma chave própria, por exemplo:

```text
chat-avatars/{botId}/{unique-id}.webp
```

Ao substituir ou remover o avatar:

1. salvar o novo estado do bot;
2. remover o objeto antigo quando não houver mais referência;
3. devolver a URL pública atual no contrato do bot e do widget.

A chave deve ser única para impedir que o navegador mantenha a imagem antiga
por cache.

## Regras de validação

- O limite de 2 MB deve ser aplicado no frontend e no backend.
- O backend deve validar o conteúdo real, não somente a extensão.
- A saída não pode exceder 800 × 800 px.
- Cores inválidas devem impedir o autosave e mostrar erro no campo.
- O cálculo de contraste deve ser determinístico e aplicado também no preview.
- O contraste deve considerar estado normal, hover, focus e mensagens de erro.

## Investigação do recorte

O spike deve provar uma solução de recorte sem criar dependência entre
`apps/web` e `apps/widget`. A preferência é usar APIs nativas e extrair apenas
helpers locais se forem suficientes. Uma biblioteca de crop só deve ser
adicionada se a experiência não puder ser implementada com segurança e
acessibilidade usando canvas e pointer events.

## Critérios de aceite

- O usuário pode selecionar, recortar, salvar, substituir e remover o avatar.
- O avatar aparece no cabeçalho e nas mensagens da IA.
- O widget aplica as quatro cores de forma independente.
- As cores de texto mantêm contraste automático adequado.
- O status do cabeçalho desaparece quando o valor for `null`.
- Arquivos acima de 2 MB ou incompatíveis são rejeitados nos dois lados.
- O arquivo antigo é removido após uma substituição bem-sucedida.
- A configuração pública retorna uma URL pública segura.
- O widget usa o fallback visual quando não há avatar ou configuração.
