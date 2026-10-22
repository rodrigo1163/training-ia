import { Module } from '@nestjs/common'

import { DocumentProcessingRepository } from '../../domain/application/repositories/document-processing-repository.js'
import { EnvModule } from '../env/env.module.js'
import { PrismaService } from './prisma/prisma.service.js'
import { PrismaDocumentProcessingRepository } from './prisma/repositories/prisma-document-processing-repository.js'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
    PrismaDocumentProcessingRepository,
    {
      provide: DocumentProcessingRepository,
      useExisting: PrismaDocumentProcessingRepository,
    },
  ],
  exports: [PrismaService, DocumentProcessingRepository],
})
export class DatabaseModule {}
