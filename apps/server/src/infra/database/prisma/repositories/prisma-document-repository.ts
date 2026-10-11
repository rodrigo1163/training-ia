import { Injectable } from '@nestjs/common';
import {
  CreateDocumentInput,
  DocumentData,
  DocumentDeletionData,
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

  async findManyByOrganizationId(
    organizationId: string,
  ): Promise<DocumentData[]> {
    return this.prisma.document.findMany({
      where: {
        organizationId,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        organizationId: true,
        name: true,
        contentType: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async findByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<DocumentDeletionData | null> {
    return this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
      select: {
        id: true,
        storageKey: true,
      },
    });
  }

  async deleteByIdAndOrganizationId(
    documentId: string,
    organizationId: string,
  ): Promise<void> {
    await this.prisma.document.deleteMany({
      where: {
        id: documentId,
        organizationId,
      },
    });
  }
}
