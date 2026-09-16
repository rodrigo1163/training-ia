import { randomUUID } from 'node:crypto'

import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { INGESTION_CONFIG } from '../config/ingestion.js'
import { requireBot, sendBotGuardFailure } from '../http/require-bot.js'
import { sendApiError } from '../http/send-api-error.js'
import { ChatService } from '../service/rag/chat.service.js'

type ChatParams = { organizationId: string; botId: string }

const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(INGESTION_CONFIG.maxMessageCharacters),
      }),
    )
    .min(1)
    .max(INGESTION_CONFIG.maxChatMessages),
})

function writeSse(
  reply: FastifyReply,
  event: string,
  data: unknown,
) {
  reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export class BotChatController {
  constructor(private readonly chatService = new ChatService()) {}

  async stream(
    request: FastifyRequest<{ Params: ChatParams; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const guard = await requireBot(request, request.params.botId)
    if (!guard.ok) {
      return sendBotGuardFailure(reply, guard)
    }

    if (guard.context.organizationId !== request.params.organizationId) {
      return sendApiError(reply, 403, 'FORBIDDEN', 'Organização inválida.')
    }

    const parsed = chatBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', 'Mensagens inválidas.')
    }

    const last = parsed.data.messages.at(-1)
    if (!last || last.role !== 'user') {
      return sendApiError(
        reply,
        400,
        'VALIDATION_ERROR',
        'A última mensagem deve ser do usuário.',
      )
    }

    const requestId = randomUUID()
    const abort = new AbortController()

    request.raw.on('close', () => {
      abort.abort()
    })

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    })

    try {
      for await (const event of this.chatService.streamAnswer({
        bot: guard.context.bot,
        messages: parsed.data.messages,
        requestId,
        signal: abort.signal,
      })) {
        if (abort.signal.aborted) {
          break
        }

        if (event.type === 'metadata') {
          writeSse(reply, 'metadata', {
            requestId: event.requestId,
            sources: event.sources,
          })
        } else if (event.type === 'token') {
          writeSse(reply, 'token', { text: event.text })
        } else if (event.type === 'error') {
          writeSse(reply, 'error', { message: event.message })
        } else {
          writeSse(reply, 'done', {})
        }
      }
    } catch {
      writeSse(reply, 'error', { message: 'Falha ao processar o chat.' })
      writeSse(reply, 'done', {})
    } finally {
      reply.raw.end()
    }
  }
}
