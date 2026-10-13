import 'reflect-metadata'

import { existsSync } from 'node:fs'
import { NestFactory } from '@nestjs/core'

import { WorkerModule } from './worker.module.js'

if (existsSync('.env')) {
  process.loadEnvFile()
}

const app = await NestFactory.createApplicationContext(WorkerModule)

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down worker`)
  await app.close()
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

console.log('Worker infrastructure connected')
