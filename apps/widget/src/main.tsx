import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatWidget } from './chat-widget'
import "./styles/widget.css";

const params = new URLSearchParams(window.location.search);
const deploymentKey = params.get("deploymentKey") ?? "dep_dev";
const apiUrl = params.get("apiUrl") ?? "http://localhost:3333";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatWidget apiUrl={apiUrl} deploymentKey={deploymentKey} />,
  </StrictMode>,
)
