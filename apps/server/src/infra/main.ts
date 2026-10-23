import { NestFactory } from '@nestjs/core'
import { AppModule } from '@/infra/app.module'
import { EnvService } from '@/infra/env/env.service'
import { configureCors } from '@/infra/http/cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const envService = app.get(EnvService)
  const port = envService.get('PORT')
  const host = envService.get('HOST')
  const origin = envService.get('CLIENT_ORIGIN')

  configureCors(app, origin)

  await app.listen(port, host);
}
await bootstrap();
