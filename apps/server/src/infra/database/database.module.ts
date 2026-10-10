import { Module } from '@nestjs/common'
import { EnvModule } from '@/infra/env/env.module'
import { PrismaService } from './prisma/prisma.service.js'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
  ],
  exports: [
    PrismaService
  ],
})
export class DatabaseModule { }
