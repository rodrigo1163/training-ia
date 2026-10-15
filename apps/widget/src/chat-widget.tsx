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
        dispatch({ type: 'failed', message: error instanceof Error ? error.message : 'Não foi possível obter uma resposta.' });
      }
    } finally {
      if (requestRef.current === abortController) requestRef.current = null;
    }
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-avatar">🤖</div>
            <div className="chat-header-info"><strong>Assistente Virtual</strong><span>Estamos online</span></div>
            <Button type="button" className="chat-close" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar conversa">✕</Button>
          </header>

          <MessageScroller.Provider autoScroll defaultScrollPosition="end" scrollPreviousItemPeek={48}>
            <MessageScroller.Root className="chat-messages-scroller">
              <MessageScroller.Viewport className="chat-messages" aria-label="Mensagens da conversa">
                <MessageScroller.Content className="chat-messages-content">
                  {state.messages.map((message) => (
                    <MessageScroller.Item key={message.id} className={`chat-message-row chat-message-row--${message.role}`} messageId={message.id} scrollAnchor={message.role === 'user'}>
                      <div className={`chat-message chat-message--${message.role}${message.failed ? ' chat-message--failed' : ''}`}>
                        {message.content || (state.isGenerating ? '…' : '')}
                      </div>
                    </MessageScroller.Item>
                  ))}
                </MessageScroller.Content>
              </MessageScroller.Viewport>
              <MessageScroller.Button className="chat-scroll-latest" aria-label="Ir para as mensagens mais recentes">↓ <span>Mensagens recentes</span></MessageScroller.Button>
            </MessageScroller.Root>
          </MessageScroller.Provider>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <Input type="text" className="chat-input" placeholder="Digite sua mensagem..." aria-label="Sua mensagem" value={input} disabled={state.isGenerating} onChange={(event) => setInput(event.target.value)} />
            <Button type="submit" className="chat-send" disabled={state.isGenerating || !input.trim()}>Enviar</Button>
          </form>
          <footer className="chat-footer">Powered by seu chatbot</footer>
        </section>
      )}

      <Button type="button" className="chat-trigger" size="icon" onClick={() => setIsOpen((previous) => !previous)} aria-label={isOpen ? 'Fechar chatbot' : 'Abrir chatbot'} aria-expanded={isOpen}>
        {isOpen ? '✕' : '💬'}
      </Button>
    </div>
  );
}
