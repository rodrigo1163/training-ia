import { createRoot } from 'react-dom/client';
import styles from './styles/widget.css?inline';
import { ChatWidget } from './chat-widget';
import { readEmbedConfig } from './embed-config';

const currentScript = document.currentScript as HTMLScriptElement | null;

function getEmbedScript() {
  return currentScript ?? document.querySelector<HTMLScriptElement>('script[data-deployment-key][data-api-url]');
}

function initialize() {
  const config = readEmbedConfig(getEmbedScript());
  if (!config) {
    console.error('Widget: data-deployment-key e data-api-url são obrigatórios.');
    return;
  }
  if (document.querySelector(`[data-widget-id="${CSS.escape(config.deploymentKey)}"]`)) return;

  const host = document.createElement('div');
  host.dataset.widgetId = config.deploymentKey;
  Object.assign(host.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '2147483647' });
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const container = document.createElement('div');
  shadow.append(style, container);
  document.body.appendChild(host);
  createRoot(container).render(<ChatWidget apiUrl={config.apiUrl} deploymentKey={config.deploymentKey} />);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
