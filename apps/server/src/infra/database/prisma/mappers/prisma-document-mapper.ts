import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Document } from '@/domain/enterprise/entities/document';
import type {
  Document as PrismaDocument,
  Prisma,
} from '../../../../../prisma/generated/prisma/client.js';

export class PrismaDocumentMapper {
  static toDomain(raw: PrismaDocument): Document {
    return Document.create(
      {
        botId: new UniqueEntityId(raw.botId),
        name: raw.name,
        storageKey: raw.storageKey,
        contentType: raw.contentType,
        size: raw.size,
        textHash: raw.textHash ?? undefined,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
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
