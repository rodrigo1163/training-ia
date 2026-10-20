import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaClient } from '@training-ia/database/client'
import { createPostgresAdapter } from '@training-ia/database/postgres'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  constructor(envService: EnvService) {
    const databaseURL = envService.get('DATABASE_URL')

    super({
      adapter: createPostgresAdapter(databaseURL),
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
