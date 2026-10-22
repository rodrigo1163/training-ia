import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { BotDeployment } from './bot-deployment.js';

describe('BotDeployment', () => {
  it('normalizes allowed origins and applies defaults', () => {
    const deployment = BotDeployment.create({
      botId: new UniqueEntityId('bot-1'),
      publicKey: 'public-key',
      allowedOrigins: ['https://app.example.com/path', 'https://app.example.com'],
    });

    expect(deployment.status).toBe('ACTIVE');
    expect(deployment.allowedOrigins).toEqual(['https://app.example.com']);
    expect(deployment.createdAt).toBeInstanceOf(Date);
  });

  it('validates origins when they are edited', () => {
    const deployment = BotDeployment.create({
      botId: new UniqueEntityId('bot-1'),
      publicKey: 'public-key',
      allowedOrigins: ['https://app.example.com'],
    });

    expect(() => {
      deployment.allowedOrigins = ['ftp://app.example.com'];
    }).toThrow();
  });
});
