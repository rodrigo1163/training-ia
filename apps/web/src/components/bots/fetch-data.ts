const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type FetchDataItem = {
  id: string;
  type: "PDF" | "TXT" | "WEBSITE";
  url: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  size: number;
  lastUpdatedAt: string;
};

export type FetchDataDetails = {
  id: string;
  type: FetchDataItem["type"];
  title: string;
  url: string;
  status: FetchDataItem["status"];
  lastUpdatedAt: string;
  markdown: string;
};

export type FetchDataPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
};

export type FetchDataResponse = {
  documents: FetchDataItem[];
  totalSize: number;
  pagination: FetchDataPagination;
};

type FetchDataPayload = {
  documents?: FetchDataItem[];
  totalSize?: number;
  pagination?: FetchDataPagination;
};

export type FetchDataQueryParams = {
  page: number;
  pageSize: number;
  search: string;
};

export const fetchDataQueryKey = (orgSlug: string, botSlug: string) =>
  ["fetch-data", orgSlug, botSlug] as const;

export const fetchDataPageQueryKey = (
  orgSlug: string,
  botSlug: string,
  params: FetchDataQueryParams,
) => [...fetchDataQueryKey(orgSlug, botSlug), params] as const;

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
  params: FetchDataQueryParams,
): Promise<FetchDataResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }

  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data?${searchParams.toString()}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os dados do bot.");
  }

  const payload = (await response.json()) as FetchDataPayload;

  if (!Array.isArray(payload.documents)) {
    throw new Error("O backend retornou uma lista de dados inválida.");
  }

  if (typeof payload.totalSize !== "number") {
    throw new Error("O backend retornou um tamanho total invÃ¡lido.");
  }

  if (
    typeof payload.pagination?.page !== "number" ||
    typeof payload.pagination.pageSize !== "number" ||
    typeof payload.pagination.totalItems !== "number"
  ) {
    throw new Error("O backend retornou uma paginação inválida.");
  }

  if (
    payload.documents.some(
      (document) =>
        typeof document.id !== "string" ||
        typeof document.type !== "string" ||
        typeof document.url !== "string" ||
        typeof document.status !== "string" ||
        typeof document.size !== "number" ||
        typeof document.lastUpdatedAt !== "string",
    )
  ) {
    throw new Error("O backend retornou dados de documentos invÃ¡lidos.");
  }

  return {
    documents: payload.documents,
    totalSize: payload.totalSize,
    pagination: payload.pagination,
  };
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

  const payload = (await response.json()) as Partial<FetchDataDetails>;

  if (
    typeof payload.id !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.markdown !== "string" ||
    typeof payload.url !== "string" ||
    (payload.type !== "PDF" &&
      payload.type !== "TXT" &&
      payload.type !== "WEBSITE") ||
    (payload.status !== "PENDING" &&
      payload.status !== "PROCESSING" &&
      payload.status !== "READY" &&
      payload.status !== "FAILED") ||
    typeof payload.lastUpdatedAt !== "string"
  ) {
    throw new Error("O backend retornou detalhes de PDF inválidos.");
  }

  const details = payload as FetchDataDetails;

  return {
    ...details,
    markdown: details.markdown,
    url: details.url.startsWith("http")
      ? details.url
      : `${API_URL}${details.url}`,
  };
}

export async function updateOrganizationDataContent(
  orgSlug: string,
  botSlug: string,
  documentId: string,
  markdown: string,
) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/data/${encodeURIComponent(documentId)}`,
    {
      body: JSON.stringify({ markdown }),
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
