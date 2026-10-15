import { Button } from "@training-ia/ui/components/ui/button";
import { Input } from "@training-ia/ui/components/ui/input";
import { useState, type FormEvent } from "react";

interface ChatWidgetProps {
  botId: string;
  initiallyOpen?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({ botId, initiallyOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Olá! 👋 Como posso ajudar você hoje?",
    },
  ]);

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();

    if (!content) return;

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
      },
    ]);

    setInput("");

    // Futuramente, chamar a API NestJS usando botId.
    console.log("Enviando mensagem para o bot:", botId);
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-avatar">🤖</div>

            <div className="chat-header-info">
              <strong>Assistente Virtual</strong>
              <span>Estamos online</span>
            </div>

            <Button
              type="button"
              className="chat-close"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar conversa"
            >
              ✕
            </Button>
          </header>

          <main className="chat-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message chat-message--${message.role}`}
              >
                {message.content}
              </div>
            ))}
          </main>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <Input
              type="text"
              className="chat-input"
              placeholder="Digite sua mensagem..."
              aria-label="Sua mensagem"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <Button type="submit" className="chat-send" disabled={!input.trim()}>
              Enviar
            </Button>
          </form>

          <footer className="chat-footer">
            Powered by seu chatbot
          </footer>
        </section>
      )}

      <Button
        type="button"
        className="chat-trigger"
        size="icon"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? "Fechar chatbot" : "Abrir chatbot"}
        aria-expanded={isOpen}
      >
        {isOpen ? "✕" : "💬"}
      </Button>
    </div>
  );
}
