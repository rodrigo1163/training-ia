import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/app.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvService } from '@/infra/env/env.service';
import {
  createAuthenticatedTestContext,
  type AuthenticatedTestContext,
} from '../../../../test/e2e/helpers/auth';
import { R2TestStorage } from '../../../../test/e2e/helpers/r2-test-storage';

function makePng(width: number, height: number): Buffer {
  const body = Buffer.alloc(33);
  body.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  return body;
}

function getStorageKey(imageUrl: string): string {
  const url = new URL(imageUrl);
  const key = url.searchParams.get('key');
  if (key) return key;

  const match = decodeURIComponent(url.pathname).match(
    /user-avatars\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.png/,
  );
  if (!match) throw new Error(`Unable to get storage key from ${imageUrl}`);
  return match[0];
}

describe('Upload user avatar (E2E)', () => {
  let app: INestApplication;
  let auth: AuthenticatedTestContext;
  let storage: R2TestStorage;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    storage = new R2TestStorage(moduleRef.get(EnvService));

    await app.init();
    auth = await createAuthenticatedTestContext(app);
  });

  afterAll(async () => {
    await storage.cleanup();
    await app.close();
  });

  test('[POST] /account/avatar validates, stores and updates Better Auth', async () => {
    const body = makePng(128, 128);
    const response = await auth.agent
      .post('/account/avatar')
      .attach('file', body, {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(response.body).toEqual({ imageUrl: expect.any(String) });

    const storageKey = getStorageKey(response.body.imageUrl);
    storage.track(storageKey);
    const storedObject = await storage.get(storageKey);
    expect(storedObject.body).toEqual(body);
    expect(storedObject.contentType).toBe('image/png');

    const session = await auth.agent.get('/api/auth/get-session').expect(200);
    expect(session.body.user.image).toBe(response.body.imageUrl);
  });
});
