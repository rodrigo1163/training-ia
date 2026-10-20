import { Module } from '@nestjs/common'

import { EnvModule } from '../env/env.module.js'
import { PrismaService } from './prisma/prisma.service.js'

@Module({
  imports: [EnvModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
