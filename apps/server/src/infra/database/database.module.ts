import { Module } from '@nestjs/common'
import { EnvModule } from '@/infra/env/env.module'
import { BotDeploymentRepository } from '@/domain/application/repositories/bot-deployment-repository'
import { BotRepository } from '@/domain/application/repositories/bot-repository'
import { ChatRepository } from '@/domain/application/repositories/chat-repository'
import { DocumentRepository } from '@/domain/application/repositories/document-repository'
import { OrganizationMemberRepository } from '@/domain/application/repositories/organization-member-repository'
import { OrganizationRepository } from '@/domain/application/repositories/organization-repository'
import { PrismaService } from './prisma/prisma.service.js'
import { PrismaBotDeploymentRepository } from './prisma/repositories/prisma-bot-deployment-repository.js'
import { PrismaBotRepository } from './prisma/repositories/prisma-bot-repository.js'
import { PrismaChatRepository } from './prisma/repositories/prisma-chat-repository.js'
import { PrismaDocumentRepository } from './prisma/repositories/prisma-document-repository.js'
import { PrismaOrganizationMemberRepository } from './prisma/repositories/prisma-organization-member-repository.js'
import { PrismaOrganizationRepository } from './prisma/repositories/prisma-organization-repository.js'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
    PrismaBotDeploymentRepository,
    PrismaBotRepository,
    PrismaChatRepository,
    PrismaDocumentRepository,
    PrismaOrganizationMemberRepository,
    PrismaOrganizationRepository,
    {
      provide: BotDeploymentRepository,
      useExisting: PrismaBotDeploymentRepository,
    },
    {
      provide: BotRepository,
      useExisting: PrismaBotRepository,
    },
    {
      provide: ChatRepository,
      useExisting: PrismaChatRepository,
    },
    {
      provide: DocumentRepository,
      useExisting: PrismaDocumentRepository,
    },
    {
      provide: OrganizationMemberRepository,
      useExisting: PrismaOrganizationMemberRepository,
    },
    {
      provide: OrganizationRepository,
      useExisting: PrismaOrganizationRepository,
    },
  ],
  exports: [
    PrismaService,
    BotDeploymentRepository,
    BotRepository,
    ChatRepository,
    DocumentRepository,
    OrganizationMemberRepository,
    OrganizationRepository,
  ],
})
export class DatabaseModule {}
