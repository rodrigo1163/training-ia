import { Injectable } from '@nestjs/common';
import {
  CreateDocumentInput,
  DocumentRepository,
} from '../../../../domain/application/repositories/document-repository.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(document: CreateDocumentInput): Promise<void> {
    await this.prisma.document.create({
      data: {
        id: document.id,
        organizationId: document.organizationId,
        name: document.name,
        storageKey: document.storageKey,
        contentType: document.contentType,
        size: document.size,
        status: document.status,
      },
    });
  }
}
