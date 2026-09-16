import http from 'node:http'

import { defineConfig, type Plugin } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'

import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

const chromeDevtoolsJsonPath =
  '/.well-known/appspecific/com.chrome.devtools.json'
const apiProxyTarget = { hostname: '127.0.0.1', port: 3333 }

function serveChromeDevtoolsJson(): Plugin {
  return {
    name: 'serve-chrome-devtools-json',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== chromeDevtoolsJsonPath) {
          next()
          return
        }

        response.setHeader('Content-Type', 'application/json')
        response.end('{}\n')
      })
    },
  }
}

function proxyApiToServer(): Plugin {
  function attachProxy(middlewares: {
    use: (
      handler: (
        request: http.IncomingMessage,
        response: http.ServerResponse,
        next: () => void,
      ) => void,
    ) => void
  }) {
    middlewares.use((request, response, next) => {
      if (!request.url?.startsWith('/api')) {
        next()
        return
      }

      const proxyRequest = http.request(
        {
          hostname: apiProxyTarget.hostname,
          port: apiProxyTarget.port,
          path: request.url,
          method: request.method,
          headers: {
            ...request.headers,
            host: `${apiProxyTarget.hostname}:${apiProxyTarget.port}`,
          },
        },
        (proxyResponse) => {
          const { 'transfer-encoding': _, ...headers } = proxyResponse.headers
          response.writeHead(proxyResponse.statusCode ?? 502, headers)
          proxyResponse.pipe(response)
        },
      )

      proxyRequest.on('error', (error) => {
        if (!response.headersSent) {
          response.writeHead(502, { 'Content-Type': 'application/json' })
        }

        response.end(
          JSON.stringify({
            error: 'Não foi possível alcançar a API.',
            message: error.message,
          }),
        )
      })

      request.pipe(proxyRequest)
    })
  }

  return {
    name: 'proxy-api-to-server',
    configureServer(server) {
      attachProxy(server.middlewares)
    },
    configurePreviewServer(server) {
      attachProxy(server.middlewares)
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    proxyApiToServer(),
    serveChromeDevtoolsJson(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),

    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
