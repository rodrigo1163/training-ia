const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export type FetchDataItem = {
  id: string
  type: 'PDF'
  url: string
  status: 'PENDING'
  lastUpdatedAt: string
}

type FetchDataResponse = {
  value?: FetchDataItem[]
}

export const fetchDataQueryKey = (organizationSlug: string) =>
  ['fetch-data', organizationSlug] as const

export async function fetchOrganizationData(organizationSlug: string) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(organizationSlug)}/fetch-data`,
    { credentials: 'include' },
  )

  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados do bot.')
  }

  const payload = (await response.json()) as FetchDataResponse

  if (!Array.isArray(payload.value)) {
    throw new Error('O backend retornou uma lista de dados inválida.')
  }

  return payload.value
}

export async function deleteOrganizationData(
  organizationSlug: string,
  documentId: string,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(organizationSlug)}/fetch-data/${encodeURIComponent(documentId)}`,
    {
      credentials: 'include',
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error('Não foi possível excluir o PDF.')
  }
}
