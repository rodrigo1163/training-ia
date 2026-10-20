import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@training-ia/database/client'

import { loadEnv } from '../../config/env.js'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    const databaseUrl = loadEnv().DATABASE_URL
    const url = new URL(databaseUrl)
    const schema = url.searchParams.get('schema') ?? undefined

    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }, { schema }),
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect()
  }
}
