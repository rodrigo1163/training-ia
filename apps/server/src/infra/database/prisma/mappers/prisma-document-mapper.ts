import { Document } from '@/domain/enterprise/entities/document';
import { DocumentContent } from '@/domain/enterprise/entities/document-content';
import type { JsonValue } from '@training-ia/core/types/json-value';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type {
  Document as PrismaDocument,
  Prisma,
} from '@training-ia/database/client';

type PrismaDocumentWithOptionalContent = PrismaDocument & {
  content?: {
    documentId: string;
    text: string;
    content: unknown;
    processedAt: Date;
    version: number;
  } | null;
};

export class PrismaDocumentMapper {
  static toDomain(raw: PrismaDocumentWithOptionalContent): Document {
    const content = raw.content
      ? DocumentContent.create(
          {
            documentId: new UniqueEntityId(raw.content.documentId),
            text: raw.content.text,
            content: raw.content.content as JsonValue,
            processedAt: raw.content.processedAt,
            version: raw.content.version,
          },
          new UniqueEntityId(raw.content.documentId),
        )
      : undefined;

    const document = Document.create(
      {
        botId: new UniqueEntityId(raw.botId),
        name: raw.name,
        storageKey: raw.storageKey,
        contentType: raw.contentType,
        size: raw.size,
        textHash: raw.textHash ?? undefined,
        status: raw.status,
        content,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );

    return document;
  }

  static toPrisma(document: Document): Prisma.DocumentUncheckedCreateInput {
    return {
      id: document.id.toString(),
      botId: document.botId.toString(),
      name: document.name,
      storageKey: document.storageKey,
      contentType: document.contentType,
      size: document.size,
      textHash: document.textHash,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
