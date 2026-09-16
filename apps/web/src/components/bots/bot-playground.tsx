import { useState } from 'react'
import { Loader2Icon, SendIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch, readApiError } from '@/lib/api-client'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    sourceId: string
    title: string
    pageNumber: number | null
  }>
}

export function BotPlayground({
  organizationId,
  botId,
}: {
  organizationId: string
  botId: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  async function handleSend() {
    const question = input.trim()
    if (!question || isStreaming) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    const assistantId = crypto.randomUUID()
    const history = [...messages, userMessage]

    setMessages([
      ...history,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await apiFetch(
        `/api/organizations/${organizationId}/bots/${botId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        },
      )

      if (!response.ok || !response.body) {
        throw new Error(
          await readApiError(response, 'Não foi possível enviar a pergunta.'),
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          const eventLine = lines.find((line) => line.startsWith('event:'))
          const dataLine = lines.find((line) => line.startsWith('data:'))
          if (!eventLine || !dataLine) {
            continue
          }

          const event = eventLine.slice(6).trim()
          const data = JSON.parse(dataLine.slice(5).trim()) as {
            text?: string
            message?: string
            sources?: ChatMessage['sources']
          }

          if (event === 'metadata' && data.sources) {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, sources: data.sources }
                  : message,
              ),
            )
          }

          if (event === 'token' && data.text) {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + data.text }
                  : message,
              ),
            )
          }

          if (event === 'error') {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content:
                        data.message ??
                        'Ocorreu um erro ao gerar a resposta.',
                    }
                  : message,
              ),
            )
          }
        }
      }
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : 'Não foi possível concluir a pergunta.',
              }
            : message,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-[28rem] flex-col gap-3">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Faça uma pergunta sobre os PDFs deste bot.
          </p>
        ) : (
          messages.map((message) => (
            <div
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                  : 'mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm'
              }
              key={message.id}
            >
              <p className="whitespace-pre-wrap">{message.content || '…'}</p>
              {message.sources && message.sources.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-border/40 pt-2 text-xs opacity-80">
                  {message.sources.map((source) => (
                    <li key={`${source.sourceId}-${source.pageNumber}`}>
                      {source.title}
                      {source.pageNumber ? ` · p. ${source.pageNumber}` : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          className="min-h-[72px]"
          disabled={isStreaming}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Digite sua pergunta…"
          value={input}
        />
        <Button
          disabled={!input.trim() || isStreaming}
          onClick={() => {
            void handleSend()
          }}
          type="button"
        >
          {isStreaming ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
