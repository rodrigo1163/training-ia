import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { BotFactory } from '../../../../test/factories/make-bot';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';

describe('Document status events (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let botId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [BotFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    auth = await createAuthenticatedTestContext(app);

    const bot = await moduleRef.get(BotFactory).makePrismaBot({
      orgId: new UniqueEntityId(auth.organization.id),
      name: 'Document Events Bot',
    });
    botId = bot.id.toString();
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /organization/:orgSlug/bots/:botSlug/fetch-data/events', async () => {
    let stream = '';

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const request = auth.agent
        .get(
          `/organization/${auth.organization.slug}/bots/document-events-bot/fetch-data/events`,
        )
        .buffer(false)
        .set('Accept', 'text/event-stream');

      request.on('response', (response) => {
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          stream += chunk;

          if (stream.includes('event: connected')) {
            settled = true;
            request.abort();
            resolve();
          }
        });
        response.on('error', (error: Error) => {
          if (!settled) reject(error);
        });
      });
      request.on('error', (error: Error) => {
        if (!settled) reject(error);
      });
      request.end();
    });

    expect(stream).toContain('event: connected');
    expect(stream).toContain(`"botId":"${botId}"`);
  });
});
