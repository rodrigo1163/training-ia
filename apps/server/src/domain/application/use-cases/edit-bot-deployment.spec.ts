import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { makeBot } from '../../../../test/factories/make-bot.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { InMemoryBotDeploymentRepository } from '../../../../test/repositories/in-memory-bot-deployment-repository.js';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository.js';
import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';
import { BotDeployment } from '../../enterprise/entities/bot-deployment.js';
import { EditBotDeploymentUseCase } from './edit-bot-deployment.js';

describe('Edit bot deployment', () => {
  let bots: InMemoryBotRepository;
  let deployments: InMemoryBotDeploymentRepository;
  let organizationMember: OrganizationMember;
  let sut: EditBotDeploymentUseCase;

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
      allowedOrigins: ['https://old.example.com'],
    }, new UniqueEntityId('deployment-1')));

    sut = new EditBotDeploymentUseCase(bots, deployments);
  });

  it('updates the deployment origins and status', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      allowedOrigins: ['https://app.example.com'],
      status: 'INACTIVE',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.deployment.allowedOrigins).toEqual(['https://app.example.com']);
    expect(result.value.deployment.status).toBe('INACTIVE');
    expect(deployments.items[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects an unknown bot', async () => {
    const result = await sut.execute({
      organizationMember,
      botSlug: 'missing-bot',
      status: 'INACTIVE',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing bot error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejects a bot without a deployment', async () => {
    deployments.items = [];

    const result = await sut.execute({
      organizationMember,
      botSlug: 'support-bot',
      status: 'INACTIVE',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('Expected a missing deployment error');
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
