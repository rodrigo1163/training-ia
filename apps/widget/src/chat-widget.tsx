import { MessageScroller } from '@shadcn/react/message-scroller';
import { Button } from '@training-ia/ui/components/ui/button';
import { Input } from '@training-ia/ui/components/ui/input';
import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { sendMessage } from './chat-client';
import { chatReducer, initialChatState } from './chat-state';

interface ChatWidgetProps {
  deploymentKey: string;
  apiUrl: string;
  initiallyOpen?: boolean;
}

export function ChatWidget({ deploymentKey, apiUrl, initiallyOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [input, setInput] = useState('');
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || state.isGenerating) return;

    const clientMessageId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const abortController = new AbortController();
    requestRef.current = abortController;
    dispatch({ type: 'start', userId: clientMessageId, assistantId, content });
    setInput('');

    try {
      for await (const streamEvent of sendMessage({
        apiUrl,
        deploymentKey,
        conversationId: state.conversationId,
        clientMessageId,
        content,
        context: {
          pageUrl: window.location.href.slice(0, 2000),
          pageTitle: document.title.slice(0, 200),
          locale: navigator.language.slice(0, 20),
        },
        signal: abortController.signal,
      })) {
        dispatch({ type: 'event', event: streamEvent });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        dispatch({ type: 'failed', message: error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel obter uma resposta.' });
      }
    } finally {
      if (requestRef.current === abortController) requestRef.current = null;
    }
  }

  return (
    <div className="flex flex-col items-end font-sans">
      {isOpen && (
        <section className="mb-4 flex h-[min(520px,calc(100dvh-120px))] w-[min(380px,calc(100vw-48px))] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
          <header className="flex items-center gap-3 bg-primary px-4 py-3.5 text-primary-foreground">
            <div className="grid size-9 place-items-center rounded-full bg-primary-foreground/15 text-lg">🤖</div>
            <div className="flex flex-1 flex-col gap-1"><strong className="text-sm font-semibold">Assistente Virtual</strong><span className="text-xs text-primary-foreground/70">Estamos online</span></div>
            <Button type="button" className="rounded-md text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar conversa">✕</Button>
          </header>

          <MessageScroller.Provider autoScroll defaultScrollPosition="end" scrollPreviousItemPeek={48}>
            <MessageScroller.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <MessageScroller.Viewport className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[pending-scroll]:invisible" aria-label="Mensagens da conversa">
                <MessageScroller.Content className="flex min-h-full flex-col gap-3 p-4">
                  {state.messages.map((message) => (
                    <MessageScroller.Item key={message.id} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} messageId={message.id} scrollAnchor={message.role === 'user'}>
                      <div className={`max-w-[85%] rounded-lg border px-3 py-3 text-sm leading-6 [overflow-wrap:anywhere] ${message.failed ? 'border-destructive/35 bg-destructive/10 text-destructive' : message.role === 'user' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-muted text-foreground'}`}>
                        {message.content || (state.isGenerating ? '…' : '')}
                      </div>
                    </MessageScroller.Item>
                  ))}
                </MessageScroller.Content>
              </MessageScroller.Viewport>
              <MessageScroller.Button className="pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-primary opacity-0 shadow-lg transition-all data-[active=true]:pointer-events-auto data-[active=true]:translate-y-0 data-[active=true]:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Ir para as mensagens mais recentes">↓ <span>Mensagens recentes</span></MessageScroller.Button>
            </MessageScroller.Root>
          </MessageScroller.Provider>

          <form className="flex gap-2 border-t border-border bg-card p-3" onSubmit={handleSendMessage}>
            <Input type="text" className="h-10 min-w-0 flex-1 rounded-md border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" placeholder="Digite sua mensagem..." aria-label="Sua mensagem" value={input} disabled={state.isGenerating} onChange={(event) => setInput(event.target.value)} />
            <Button type="submit" className="h-10 rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50" disabled={state.isGenerating || !input.trim()}>Enviar</Button>
          </form>
          <footer className="bg-card px-2 py-2 text-center text-[11px] text-muted-foreground">Powered by seu chatbot</footer>
        </section>
      )}

      <Button type="button" className="size-14 rounded-full border-0 bg-primary text-2xl text-primary-foreground shadow-xl transition-all hover:-translate-y-px hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50" size="icon" onClick={() => setIsOpen((previous) => !previous)} aria-label={isOpen ? 'Fechar chatbot' : 'Abrir chatbot'} aria-expanded={isOpen}>
        {isOpen ? '✕' : '💬'}
      </Button>
    </div>
  );
}
