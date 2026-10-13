import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { Redis } from 'ioredis'

import { loadEnv } from '../../config/env.js'

@Injectable()
export class RedisConnection implements OnModuleInit, OnApplicationShutdown {
  readonly client = new Redis(loadEnv().REDIS_URL)

  async onModuleInit() {
    await this.client.ping()
  }

  async onApplicationShutdown() {
    await this.client.quit()
  }
}
