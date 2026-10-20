import { Module } from '@nestjs/common'

import { DatabaseConnection } from '../connections/database.connection.js'
import { PrismaService } from './prisma.service.js'

@Module({
  providers: [DatabaseConnection, PrismaService],
  exports: [DatabaseConnection, PrismaService],
})
export class DatabaseModule {}
