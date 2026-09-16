import { ChatOpenAI } from '@langchain/openai'

import { env } from '../../env.js'

export function createChatModel(options?: {
  temperature?: number
  maxTokens?: number
}) {
  return new ChatOpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_CHAT_MODEL,
    temperature: options?.temperature ?? 0.2,
    maxTokens: options?.maxTokens,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': env.OPENROUTER_APP_URL,
        'X-Title': env.OPENROUTER_APP_NAME,
      },
    },
  })
}
