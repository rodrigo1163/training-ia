import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatWidget } from './chat-widget'
import "./styles/widget.css";

const params = new URLSearchParams(window.location.search);
const botId = params.get("botId") ?? "bot_dev_123";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatWidget botId={botId} />,
  </StrictMode>,
)
