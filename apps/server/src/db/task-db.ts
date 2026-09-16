import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { z } from 'zod'

import * as botSchema from './bot-schema.js'
import * as schema from './schema.js'

const taskEnvSchema = z.object({
  DATABASE_URL: z.url().startsWith('postgresql://'),
})

const taskEnv = taskEnvSchema.parse(process.env)

export const taskPool = new Pool({
  connectionString: taskEnv.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 20_000,
})

taskPool.on('error', (error) => {
  console.error('pg task pool error', error)
})

export const taskDb = drizzle(taskPool, {
  schema: {
    ...schema,
    ...botSchema,
  },
})
