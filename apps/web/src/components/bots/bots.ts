const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type Bot = {
  id: string;
  name: string;
  slug: string;
  documentCount: number;
  createdAt: string;
};

type BotResponse = { bot?: Bot };
type BotsResponse = { bots?: Bot[] };

export const botsQueryKey = (orgSlug: string) => ["bots", orgSlug] as const;

export const botQueryKey = (orgSlug: string, botSlug: string) =>
  ["bot", orgSlug, botSlug] as const;

function botsUrl(orgSlug: string) {
  return `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots`;
}

export async function fetchBots(orgSlug: string) {
  const response = await fetch(botsUrl(orgSlug), {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Não foi possível carregar os bots.");
  const payload = (await response.json()) as BotsResponse;
  if (!Array.isArray(payload.bots)) {
    throw new Error("O backend retornou uma lista de bots inválida.");
  }
  return payload.bots;
}

export async function fetchBot(orgSlug: string, botSlug: string) {
  const response = await fetch(
    `${botsUrl(orgSlug)}/${encodeURIComponent(botSlug)}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Não foi possível carregar o bot.");
  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("O backend retornou um bot inválido.");
  return payload.bot;
}

export async function createBot(orgSlug: string, name: string) {
  const response = await fetch(botsUrl(orgSlug), {
    body: JSON.stringify({ name }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "Já existe um bot com esse nome."
        : "Não foi possível criar o bot.",
    );
  }
  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("O backend retornou um bot inválido.");
  return payload.bot;
}

export async function deleteBot(orgSlug: string, botSlug: string) {
  const response = await fetch(
    `${botsUrl(orgSlug)}/${encodeURIComponent(botSlug)}`,
    { credentials: "include", method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "Remova os PDFs antes de excluir este bot."
        : "Não foi possível excluir o bot.",
    );
  }
}
