import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { EnvService } from './env/env.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bodyParser: false,
  });
  const envService = app.get(EnvService)
  const port = envService.get('PORT')
  const host = envService.get('HOST')
  const origin = envService.get('CLIENT_ORIGIN')

  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(port, host);
}
await bootstrap();
