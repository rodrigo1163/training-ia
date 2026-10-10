import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import {
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import request from 'supertest';
import { AppModule } from '@/infra/app.module';

@Controller('__test')
class ProtectedTestController {
  @Get('protected')
  getProtected(@Session() session: UserSession) {
    return { userId: session.user.id };
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let sessionCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProtectedTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects a protected route without a session', () => {
    return request(app.getHttpServer()).get('/__test/protected').expect(401);
  });

  it('allows the configured browser origin for credentialed requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Origin', process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      process.env.CLIENT_ORIGIN,
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not grant CORS access to an unknown origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Origin', 'http://malicious.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  const runAuthE2e = process.env.RUN_AUTH_E2E === 'true';

  describe.skipIf(!runAuthE2e)('Better Auth persistence', () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'password-for-e2e-test';

    it('signs up and returns a session cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          name: 'E2E User',
          email,
          password,
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieList: string[] = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
      sessionCookie = cookieList
        .map((cookie) => cookie.split(';', 1)[0])
        .join('; ');
      expect(sessionCookie).toContain('better-auth.session_token=');
    });

    it('reads the session through the cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body?.user?.email).toBe(email);
    });

    it('creates and lists an organization for the session user', async () => {
      const slug = `e2e-${Date.now()}`;
      const createResponse = await request(app.getHttpServer())
        .post('/api/auth/organization/create')
        .set('Cookie', sessionCookie)
        .send({ name: 'E2E Organization', slug })
        .expect(200);

      expect(createResponse.body?.slug).toBe(slug);

      const listResponse = await request(app.getHttpServer())
        .get('/api/auth/organization/list')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(listResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug, name: 'E2E Organization' }),
        ]),
      );
    });

    it('signs out and invalidates the session', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', sessionCookie)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
