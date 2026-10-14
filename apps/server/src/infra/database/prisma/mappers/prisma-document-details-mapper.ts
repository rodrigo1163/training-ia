import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';
import type {
  Document as PrismaDocument,
  DocumentContent as PrismaDocumentContent,
} from '../../../../../prisma/generated/prisma/client.js';

type PrismaDocumentDetails = PrismaDocument & {
  content: PrismaDocumentContent | null;
};

export class PrismaDocumentDetailsMapper {
  static toDomain(raw: PrismaDocumentDetails): DocumentDetails {
    return DocumentDetails.create({
      documentId: new UniqueEntityId(raw.id),
      botId: new UniqueEntityId(raw.botId),
      name: raw.name,
      storageKey: raw.storageKey,
      contentType: raw.contentType,
      size: raw.size,
      textHash: raw.textHash ?? undefined,
      status: raw.status,
      text: raw.content?.text ?? '',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
