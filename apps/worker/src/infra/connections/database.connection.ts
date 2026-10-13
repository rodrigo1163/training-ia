import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { Pool } from 'pg'

import { loadEnv } from '../../config/env.js'

@Injectable()
export class DatabaseConnection implements OnModuleInit, OnApplicationShutdown {
  readonly pool = new Pool({ connectionString: loadEnv().DATABASE_URL })

  async onModuleInit() {
    await this.pool.query('SELECT 1')
  }

  async onApplicationShutdown() {
    await this.pool.end()
  }
}
