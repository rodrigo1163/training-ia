import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import {
  Document,
  type DocumentProps,
} from '../../src/domain/enterprise/entities/document.js';
import { PrismaDocumentMapper } from '../../src/infra/database/prisma/mappers/prisma-document-mapper.js';
import { PrismaService } from '../../src/infra/database/prisma/prisma.service.js';

export function makeDocument(
  override: Partial<DocumentProps> = {},
  id?: UniqueEntityId,
) {
  const suffix = randomUUID();

  return Document.create(
    {
      botId: new UniqueEntityId(),
      name: `document-${suffix}.pdf`,
      storageKey: `test/documents/document-${suffix}/original.pdf`,
      contentType: 'application/pdf',
      size: 1024,
      ...override,
    },
    id,
  );
}

@Injectable()
export class DocumentFactory {
  constructor(private readonly prisma: PrismaService) { }

  async makePrismaDocument(
    data: Partial<DocumentProps> = {},
    id?: UniqueEntityId,
  ): Promise<Document> {
    const document = makeDocument(data, id);

    await this.prisma.document.create({
      data: PrismaDocumentMapper.toPrisma(document),
    });

    return document;
  }
}
