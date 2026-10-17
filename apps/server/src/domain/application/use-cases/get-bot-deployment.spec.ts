import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotDeploymentRepository } from '../../../../test/repositories/in-memory-bot-deployment-repository.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import { GetBotDeploymentUseCase } from './get-bot-deployment.js';

describe('Get bot deployment', () => {
  let bots: InMemoryBotRepository;
  let deployments: InMemoryBotDeploymentRepository;
  let organizationMember: OrganizationMember;
  let sut: GetBotDeploymentUseCase;

  beforeEach(async () => {
    bots = new InMemoryBotRepository();
    deployments = new InMemoryBotDeploymentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });

    const bot = makeBot({ orgId: organizationMember.orgId, name: 'Support Bot' }, new UniqueEntityId('bot-1'));
    await bots.create(bot);
    await deployments.create(BotDeployment.create({
      botId: bot.id,
      publicKey: 'public-key',
      allowedOrigins: ['https://app.example.com'],
    }, new UniqueEntityId('deployment-1')));

    sut = new GetBotDeploymentUseCase(bots, deployments);
  });

  it('returns the bot deployment', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.deployment?.publicKey).toBe('public-key');
    expect(result.value.deployment?.botId).toEqual(new UniqueEntityId('bot-1'));
  });

  it('returns null when the bot has no deployment', async () => {
    deployments.items = [];

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.deployment).toBeNull();
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
