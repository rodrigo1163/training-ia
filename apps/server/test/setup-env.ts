process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '3333';
process.env.DATABASE_URL ??= 'postgresql://docker:docker@localhost:5433/training-ia';
process.env.BETTER_AUTH_SECRET ??=
  'local-development-secret-with-at-least-32-characters';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3333';
process.env.CLIENT_ORIGIN ??= 'http://localhost:3000';
