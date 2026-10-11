import type {
  CreateDocumentInput,
  DocumentData,
  DocumentDeletionData,
} from '../../../../domain/application/repositories/document-repository.js';
import type {
  Document as PrismaDocument,
  Prisma,
} from '../../../../../prisma/generated/prisma/client.js';

export class PrismaDocumentMapper {
  static toDomain(document: PrismaDocument): DocumentData {
    return {
      id: document.id,
      botId: document.botId,
      name: document.name,
      contentType: document.contentType,
      status: document.status,
      updatedAt: document.updatedAt,
    };
  }

  static toDeletionData(document: PrismaDocument): DocumentDeletionData {
    return {
      id: document.id,
      storageKey: document.storageKey,
    };
  }

  static toPrisma(
    document: CreateDocumentInput,
  ): Prisma.DocumentUncheckedCreateInput {
    return {
      id: document.id,
      botId: document.botId,
      name: document.name,
      storageKey: document.storageKey,
      contentType: document.contentType,
      size: document.size,
      status: document.status,
    };
  }
}
