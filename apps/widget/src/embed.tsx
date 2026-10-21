import { createRoot } from 'react-dom/client';
import styles from './styles/tailwind.css?inline';
import { ChatWidget } from './chat-widget';
import { readEmbedConfig } from './embed-config';

const currentScript = document.currentScript as HTMLScriptElement | null;

function getEmbedScript() {
  return currentScript ?? document.querySelector<HTMLScriptElement>('script[data-deployment-key][data-api-url]');
}

function initialize(script = getEmbedScript()) {
  const config = readEmbedConfig(script);
  if (!config) {
    console.error('Widget: data-deployment-key and data-api-url are required.');
    return;
  }
  if (document.querySelector(`[data-widget-id="${CSS.escape(config.deploymentKey)}"]`)) return;

  const mountTarget = config.displayMode === 'inline' ? script?.parentElement : document.body;
  if (!mountTarget) return;

  const host = document.createElement('div');
  host.dataset.widgetId = config.deploymentKey;
  if (config.displayMode === 'inline') {
    Object.assign(host.style, { display: 'grid', placeItems: 'center', width: '100%' });
  } else {
    Object.assign(host.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '2147483647' });
  }
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const container = document.createElement('div');
  shadow.append(style, container);
  mountTarget.appendChild(host);
  createRoot(container).render(<ChatWidget apiUrl={config.apiUrl} deploymentKey={config.deploymentKey} displayMode={config.displayMode} />);
}

window.addEventListener('training-ia:mount-chat-widget', (event) => {
  const script = (event as CustomEvent<{ script?: HTMLScriptElement }>).detail?.script;
  initialize(script);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
else initialize();
