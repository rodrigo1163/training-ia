import { MessageScroller } from '@shadcn/react/message-scroller';
import Markdown from 'react-markdown';
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

const loadingMessages = [
  'Gerando resposta...',
  'Analisando sua pergunta...',
  'Consultando as informações necessárias...',
  'Finalizando sua resposta...',
] as const;

export function ChatWidget({ deploymentKey, apiUrl, initiallyOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [input, setInput] = useState('');
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!state.isGenerating) return;

    const timeoutIds = loadingMessages.slice(1).map((message, index) =>
      window.setTimeout(() => {
        setLoadingMessage(message);
      }, (index + 1) * 4000),
    );

    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [state.isGenerating]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || state.isGenerating) return;

    const clientMessageId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const abortController = new AbortController();
    requestRef.current = abortController;
    setLoadingMessage(loadingMessages[0]);
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
        <section className="mb-4 flex h-[676px] w-[424px] flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-2xl">
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
                      <div className={`max-w-[85%] rounded-lg border px-3 py-3 text-sm leading-6 [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${message.role === 'assistant' && !message.content && state.isGenerating ? 'border-0 bg-transparent' : message.failed ? 'border-destructive/35 bg-destructive/10 text-destructive' : message.role === 'user' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-muted text-foreground'}`}>
                        {message.content ? (
                          message.role === 'assistant' ? (
                            <Markdown skipHtml>{message.content}</Markdown>
                          ) : (
                            message.content
                          )
                        ) : state.isGenerating ? (
                          <div className="flex min-w-28 flex-col items-start gap-1" aria-live="polite" aria-label={loadingMessage}>
                            <div className="flex items-center gap-1" aria-hidden="true">
                              <span className="size-1.5 animate-bounce rounded-full bg-current" />
                              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                            </div>
                            <span className="chat-shimmer text-[11px] text-muted-foreground">{loadingMessage}</span>
                          </div>
                        ) : null}
                      </div>
                    </MessageScroller.Item>
                  ))}
                </MessageScroller.Content>
              </MessageScroller.Viewport>
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
