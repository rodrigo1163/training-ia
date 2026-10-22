import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { Redis } from 'ioredis'

import { EnvService } from '../../env/env.service.js'

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  readonly client: Redis

  constructor(envService: EnvService) {
    this.client = new Redis(envService.get('REDIS_URL'))
  }

  async onModuleInit() {
    await this.client.ping()
  }

  async onApplicationShutdown() {
    await this.client.quit()
  }
}
