import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaClient } from '@training-ia/database/client'
import { createPostgresAdapter } from '@training-ia/database/postgres'

import { EnvService } from '../../env/env.service.js'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(envService: EnvService) {
    super({
      adapter: createPostgresAdapter(envService.get('DATABASE_URL')),
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect()
  }
}
