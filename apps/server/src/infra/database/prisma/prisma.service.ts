import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../../prisma/generated/prisma/client.js'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseURL = process.env.DATABASE_URL

    if (!databaseURL) {
      throw new Error('DATABASE_URL environment variable is required.')
    }

    const url = new URL(databaseURL)
    const schema = url.searchParams.get('schema') ?? undefined

    super({
      adapter: new PrismaPg({ connectionString: databaseURL }, { schema }),
      log: ['warn', 'error'],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
