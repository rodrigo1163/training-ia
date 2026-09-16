import { INGESTION_CONFIG } from '../../config/ingestion.js'
import { createChatModel } from '../../lib/openrouter/chat.js'
import type { BotRow } from '../../repositories/bot.repository.js'
import {
  buildRagMessages,
  type ChatCitation,
  type ChatHistoryMessage,
} from './prompt.js'
import { RetrievalService } from './retrieval.service.js'

export type ChatEvent =
  | { type: 'metadata'; requestId: string; sources: ChatCitation[] }
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

const NO_CONTEXT_REPLY =
  'Não encontrei essa informação na documentação disponível deste bot.'

export class ChatService {
  constructor(private readonly retrieval = new RetrievalService()) {}

  async *streamAnswer(input: {
    bot: BotRow
    messages: ChatHistoryMessage[]
    requestId: string
    signal?: AbortSignal
  }): AsyncGenerator<ChatEvent> {
    const question = input.messages.at(-1)?.content?.trim()

    if (!question) {
      yield { type: 'error', message: 'Pergunta inválida.' }
      yield { type: 'done' }
      return
    }

    const history = input.messages.slice(0, -1).slice(-INGESTION_CONFIG.maxChatMessages)
    const retrieved = await this.retrieval.retrieve({
      organizationId: input.bot.organizationId,
      botId: input.bot.id,
      question,
    })

    yield {
      type: 'metadata',
      requestId: input.requestId,
      sources: retrieved.citations,
    }

    if (retrieved.chunks.length === 0) {
      yield { type: 'token', text: NO_CONTEXT_REPLY }
      yield { type: 'done' }
      return
    }

    const model = createChatModel({ temperature: 0.2 })
    const promptMessages = buildRagMessages({
      systemPrompt: input.bot.systemPrompt,
      chunks: retrieved.chunks,
      history,
      question,
    })

    try {
      const stream = await model.stream(promptMessages, {
        signal: input.signal,
      })

      for await (const chunk of stream) {
        if (input.signal?.aborted) {
          break
        }

        const text =
          typeof chunk.content === 'string'
            ? chunk.content
            : Array.isArray(chunk.content)
              ? chunk.content
                  .map((part) =>
                    typeof part === 'string'
                      ? part
                      : part.type === 'text'
                        ? part.text
                        : '',
                  )
                  .join('')
              : ''

        if (text) {
          yield { type: 'token', text }
        }
      }

      yield { type: 'done' }
    } catch (error) {
      if (input.signal?.aborted) {
        yield { type: 'done' }
        return
      }

      yield {
        type: 'error',
        message:
          error instanceof Error
            ? 'Falha ao gerar a resposta.'
            : 'Falha ao gerar a resposta.',
      }
      yield { type: 'done' }
    }
  }
}
