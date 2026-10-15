import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatWidget } from './chat-widget'
import "./styles/widget.css";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatWidget botId="bot_dev_123" />,
  </StrictMode>,
)
