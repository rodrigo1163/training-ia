import { UniqueEntityId } from '../../../core/entities/unique-entity-id.js';
import { ResourceNotFoundError } from '../../../core/errors/errors/resource-not-found-error.js';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotDeploymentRepository } from '../../../../test/repositories/in-memory-bot-deployment-repository.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import { DeploymentAlreadyExistsError } from './errors/deployment-already-exists-error.js';
import { PublishBotDeploymentUseCase } from './publish-bot-deployment.js';

describe('Publish bot deployment', () => {
  let bots: InMemoryBotRepository;
  let deployments: InMemoryBotDeploymentRepository;
  let organizationMember: OrganizationMember;
  let sut: PublishBotDeploymentUseCase;

  beforeEach(async () => {
    bots = new InMemoryBotRepository();
    deployments = new InMemoryBotDeploymentRepository();
    organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });

    await bots.create(makeBot({
      orgId: organizationMember.orgId,
      name: 'Support Bot',
    }, new UniqueEntityId('bot-1')));

    sut = new PublishBotDeploymentUseCase(bots, deployments);
  });

  it('publishes a bot with its allowed origins', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      allowedOrigins: ['https://app.example.com'],
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.deployment.botId).toEqual(new UniqueEntityId('bot-1'));
    expect(result.value.deployment.allowedOrigins).toEqual(['https://app.example.com']);
    expect(result.value.deployment.publicKey).toMatch(/^dep_[A-Za-z0-9_-]+$/);
    expect(deployments.items).toHaveLength(1);
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      allowedOrigins: ['https://app.example.com'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejects a bot that is already published', async () => {
    const bot = await bots.findBySlugAndOrgId('support-bot', organizationMember.orgId.toString());
    if (!bot) throw new Error('Expected the bot to exist');
    await deployments.create(BotDeployment.create({
      botId: bot.id,
      publicKey: 'public-key',
      allowedOrigins: ['https://app.example.com'],
    }));

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      allowedOrigins: ['https://app.example.com'],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a duplicate deployment error');
    expect(result.value).toBeInstanceOf(DeploymentAlreadyExistsError);
  });
});
