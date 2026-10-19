export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

export type TiptapDocument = {
  type: "doc";
  content: TiptapNode[];
};

export function textToTiptap(text: string): TiptapDocument {
  const normalizedText = text.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
  const blocks = normalizedText.length === 0 ? [] : normalizedText.split(/\n{2,}/);

  return {
    type: "doc",
    content: blocks.map((block) => ({
      type: "paragraph",
      content: [{ type: "text", text: block.replace(/\n/g, " ") }],
    })),
  };
}

export function isTiptapDocument(value: unknown): value is TiptapDocument {
  if (!isRecord(value) || value.type !== "doc" || !Array.isArray(value.content)) {
    return false;
  }

  return value.content.every(isTiptapNode);
}

export function parseTiptapDocument(value: unknown): TiptapDocument | null {
  return isTiptapDocument(value) ? value : null;
}

function isTiptapNode(value: unknown): value is TiptapNode {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.text !== undefined && typeof value.text !== "string") {
    return false;
  }

  return value.content === undefined ||
    (Array.isArray(value.content) && value.content.every(isTiptapNode));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
