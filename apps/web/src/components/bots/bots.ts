import { env } from "@/env";

const API_URL = env.VITE_API_URL;

export const botPersonalities = ["NEUTRAL", "PROFESSIONAL", "FRIENDLY", "CONCISE", "DETAILED", "EMPATHETIC", "PLAYFUL", "TECHNICAL", "EDUCATIONAL"] as const;
export const botLanguages = ["pt-BR"] as const;
export type BotPersonality = (typeof botPersonalities)[number];
export type Bot = { id: string; name: string; description: string | null; personality: BotPersonality; language: string; systemMessage: string | null; slug: string; documentCount: number; createdAt: string };
export type EditBotInput = { name: string; description: string | null; personality: BotPersonality; language: string; systemMessage: string | null };
type BotResponse = { bot?: Bot };
type BotsResponse = { bots?: Bot[] };
export const botsQueryKey = (orgSlug: string) => ["bots", orgSlug] as const;
export const botQueryKey = (orgSlug: string, botSlug: string) => ["bot", orgSlug, botSlug] as const;
function botsUrl(orgSlug: string) { return `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots`; }

export async function fetchBots(orgSlug: string) {
  const response = await fetch(botsUrl(orgSlug), { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load bots.");
  const payload = (await response.json()) as BotsResponse;
  if (!Array.isArray(payload.bots)) throw new Error("The backend returned an invalid bot list.");
  return payload.bots;
}
export async function fetchBot(orgSlug: string, botSlug: string) {
  const response = await fetch(`${botsUrl(orgSlug)}/${encodeURIComponent(botSlug)}`, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load the bot.");
  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");
  return payload.bot;
}
export async function createBot(orgSlug: string, name: string) {
  const response = await fetch(botsUrl(orgSlug), { body: JSON.stringify({ name }), credentials: "include", headers: { "Content-Type": "application/json" }, method: "POST" });
  if (!response.ok) throw new Error(response.status === 409 ? "A bot with this name already exists." : "Unable to create the bot.");
  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");
  return payload.bot;
}
export async function editBot(orgSlug: string, botSlug: string, input: EditBotInput) {
  const response = await fetch(`${botsUrl(orgSlug)}/${encodeURIComponent(botSlug)}`, { body: JSON.stringify(input), credentials: "include", headers: { "Content-Type": "application/json" }, method: "PATCH" });
  if (!response.ok) throw new Error("Unable to save the bot settings.");
  const payload = (await response.json()) as BotResponse;
  if (!payload.bot) throw new Error("The backend returned an invalid bot.");
  return payload.bot;
}
export async function deleteBot(orgSlug: string, botSlug: string) {
  const response = await fetch(`${botsUrl(orgSlug)}/${encodeURIComponent(botSlug)}`, { credentials: "include", method: "DELETE" });
  if (!response.ok) throw new Error(response.status === 409 ? "Remove the PDFs before deleting this bot." : "Unable to delete the bot.");
}
