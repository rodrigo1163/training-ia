import { NestFactory } from '@nestjs/core'
import { AppModule } from '@/infra/app.module'
import { EnvService } from '@/infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
