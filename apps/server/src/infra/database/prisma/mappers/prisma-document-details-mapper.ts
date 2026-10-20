import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { DocumentDetails } from '@/domain/enterprise/value-objects/document-details';
import type { JsonValue } from '@training-ia/core/types/json-value';
import type {
  Document as PrismaDocument,
  DocumentContent as PrismaDocumentContent,
} from '@training-ia/database/client';

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
      content: raw.content?.content as JsonValue | undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
