import type {
  GenerateStarterQuestionInput,
  GenerateStarterQuestionOutput,
} from "../../types/chat";

export class StarterQuestionRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function generateStarterQuestion(
  input: GenerateStarterQuestionInput,
): Promise<GenerateStarterQuestionOutput> {
  const response = await fetch(
    `${input.apiUrl.replace(/\/$/, "")}/public/chat/${encodeURIComponent(input.deploymentKey)}/starter-questions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: input.conversationId,
        userMessageId: input.userMessageId,
        slot: input.slot,
        clickedQuestion: input.clickedQuestion,
      }),
      signal: input.signal,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new StarterQuestionRequestError(
      response.status,
      payload?.message ?? "Unable to generate a starter question.",
    );
  }

  const payload = (await response.json()) as Partial<GenerateStarterQuestionOutput>;
  if (typeof payload.question !== "string" && payload.question !== null) {
    throw new StarterQuestionRequestError(
      502,
      "The backend returned an invalid starter question.",
    );
  }

  return { question: payload.question ?? null };
}
