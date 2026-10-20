import 'reflect-metadata'

import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)

  app.enableShutdownHooks()

  console.log('Worker infrastructure connected')
}

await bootstrap()
