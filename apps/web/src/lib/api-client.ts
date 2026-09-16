import { env } from '@/env'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)

  return fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
}

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload: unknown = await response.json()

    if (payload !== null && typeof payload === 'object' && 'error' in payload) {
      const error = payload.error

      if (typeof error === 'string') {
        return error
      }

      if (
        error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        return error.message
      }
    }
  } catch {
    // A resposta pode não ser JSON (proxy, timeout, etc.).
  }

  return fallback
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)

  if (!response.ok) {
    throw new ApiError(
      await readApiError(response, 'Não foi possível concluir a requisição.'),
      response.status,
    )
  }

  return (await response.json()) as T
}
