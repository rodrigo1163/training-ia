const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type FetchDataItem = {
  id: string;
  type: "PDF" | "TXT";
  url: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  lastUpdatedAt: string;
};

export type FetchDataDetails = FetchDataItem & {
  title: string;
  text: string;
};

type FetchDataResponse = {
  documents?: FetchDataItem[];
};

export const fetchDataQueryKey = (orgSlug: string, botSlug: string) =>
  ["fetch-data", orgSlug, botSlug] as const;

export const fetchDataDetailsQueryKey = (
  orgSlug: string,
  botSlug: string,
  documentId: string,
) => ["fetch-data-details", orgSlug, botSlug, documentId] as const;

export const fetchDataEventsUrl = (orgSlug: string, botSlug: string) =>
  `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/events`;

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

export async function fetchOrganizationDataDetails(
  orgSlug: string,
  botSlug: string,
  documentId: string,
): Promise<FetchDataDetails> {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/${encodeURIComponent(documentId)}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os detalhes do PDF.");
  }

  const payload = (await response.json()) as FetchDataDetails;

  if (
    typeof payload.id !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.text !== "string"
  ) {
    throw new Error("O backend retornou detalhes de PDF inválidos.");
  }

  return {
    ...payload,
    url: payload.url.startsWith("http")
      ? payload.url
      : `${API_URL}${payload.url}`,
  };
}

export async function updateOrganizationDataText(
  orgSlug: string,
  botSlug: string,
  documentId: string,
  text: string,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/data/${encodeURIComponent(documentId)}`,
    {
      body: JSON.stringify({ text }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível atualizar o texto do PDF.");
  }
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
