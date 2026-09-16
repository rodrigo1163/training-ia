export function buildSourceObjectKey(input: {
  environment: string
  organizationId: string
  botId: string
  sourceId: string
}): string {
  return `${input.environment}/organizations/${input.organizationId}/bots/${input.botId}/sources/${input.sourceId}.pdf`
}

export function buildBotPrefix(input: {
  environment: string
  organizationId: string
  botId: string
}): string {
  return `${input.environment}/organizations/${input.organizationId}/bots/${input.botId}/`
}
