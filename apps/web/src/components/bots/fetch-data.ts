const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type FetchDataItem = {
  id: string;
  type: "PDF";
  url: string;
  status: "PENDING";
  lastUpdatedAt: string;
};

type FetchDataResponse = {
  documents?: FetchDataItem[];
};

export const fetchDataQueryKey = (orgSlug: string, botSlug: string) =>
  ["fetch-data", orgSlug, botSlug] as const;

export async function fetchOrganizationData(
  orgSlug: string,
  botSlug: string,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os dados do bot.");
  }

  const payload = (await response.json()) as FetchDataResponse;

  if (!Array.isArray(payload.documents)) {
    throw new Error("O backend retornou uma lista de dados inválida.");
  }

  return payload.documents;
}

export async function deleteOrganizationData(
  orgSlug: string,
  botSlug: string,
  documentId: string,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/${encodeURIComponent(documentId)}`,
    {
      credentials: "include",
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível excluir o PDF.");
  }
}

export async function deleteManyOrganizationData(
  orgSlug: string,
  botSlug: string,
  documentIds: string[],
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data`,
    {
      body: JSON.stringify({ documentIds }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível excluir os PDFs selecionados.");
  }
}
