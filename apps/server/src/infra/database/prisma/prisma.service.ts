import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@training-ia/database/client'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  constructor(envService: EnvService) {
    const databaseURL = envService.get('DATABASE_URL')

    const url = new URL(databaseURL)
    const schema = url.searchParams.get('schema') ?? undefined

    super({
      adapter: new PrismaPg({ connectionString: databaseURL }, { schema }),
      // log: ['query'],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
