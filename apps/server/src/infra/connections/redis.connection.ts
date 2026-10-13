import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { Redis } from 'ioredis'

import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class RedisConnection implements OnModuleInit, OnApplicationShutdown {
  readonly client: Redis
  readonly subscriber: Redis

  constructor(private readonly envService: EnvService) {
    this.client = new Redis(this.envService.get('REDIS_URL'))
    this.subscriber = this.client.duplicate()
  }

  async onModuleInit() {
    await Promise.all([this.client.ping(), this.subscriber.ping()])
  }

  async onApplicationShutdown() {
    await Promise.all([this.client.quit(), this.subscriber.quit()])
  }
}
