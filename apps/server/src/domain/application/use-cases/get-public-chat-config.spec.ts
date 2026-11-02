import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { BotDeployment } from '../../enterprise/entities/bot-deployment';
import { makeBot } from '../../../../test/factories/make-bot';
import { InMemoryBotDeploymentRepository } from '../../../../test/repositories/in-memory-bot-deployment-repository';
import { InMemoryBotRepository } from '../../../../test/repositories/in-memory-bot-repository';
import { GetPublicChatConfigUseCase } from './get-public-chat-config';
import { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';
import { GeneratedStarterQuestionRepository } from '../repositories/generated-starter-question-repository';

class FakeGeneratedStarterQuestionRepository extends GeneratedStarterQuestionRepository {
  questions: GeneratedStarterQuestion[] = [];

  async findByBotId() { return this.questions; }
  async findByBotIdForConversation() { return this.questions; }
  async findByIdempotencyKey() { return null; }
  async create() { return null; }
  async markUsed() { }
}

describe('Get public chat config', () => {
  it('returns only the bot source needed to build the public contract', async () => {
    const bots = new InMemoryBotRepository();
    const deployments = new InMemoryBotDeploymentRepository();
    const generatedQuestions = new FakeGeneratedStarterQuestionRepository();
    const bot = makeBot(
      {
        name: 'Support Bot',
        chatConfig: {
          ...makeBot().chatConfig,
          initialMessage: 'Welcome!',
          model: 'private-model',
        },
      },
      new UniqueEntityId('bot-1'),
    );
    await bots.create(bot);
    await deployments.create(
      BotDeployment.create(
        {
          botId: bot.id,
          publicKey: 'public-key',
          allowedOrigins: ['https://app.example.com'],
        },
        new UniqueEntityId('deployment-1'),
      ),
    );

    const result = await new GetPublicChatConfigUseCase(
      deployments,
      bots,
      generatedQuestions,
    ).execute({ deploymentKey: 'public-key' });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.bot.chatConfig.initialMessage).toBe('Welcome!');
    expect(result.value.bot.chatConfig.model).toBe('private-model');
  });

  it('prioritizes configured questions and fills the remaining slots from the catalog', async () => {
    const bots = new InMemoryBotRepository();
    const deployments = new InMemoryBotDeploymentRepository();
    const generatedQuestions = new FakeGeneratedStarterQuestionRepository();
    const bot = makeBot(
      {
        chatConfig: {
          ...makeBot().chatConfig,
          starterQuestions: ['Manual?'],
        },
      },
      new UniqueEntityId('bot-1'),
    );
    await bots.create(bot);
    await deployments.create(
      BotDeployment.create(
        {
          botId: bot.id,
          publicKey: 'public-key',
          allowedOrigins: ['https://app.example.com'],
        },
        new UniqueEntityId('deployment-1'),
      ),
    );
    generatedQuestions.questions = [
      GeneratedStarterQuestion.create({
        botId: bot.id,
        idempotencyKey: 'catalog-1',
        originalText: 'Manual?',
        normalizedText: 'manual?',
      }),
      GeneratedStarterQuestion.create({
        botId: bot.id,
        idempotencyKey: 'catalog-2',
        originalText: 'Gerada?',
        normalizedText: 'gerada?',
      }),
    ];

    const result = await new GetPublicChatConfigUseCase(
      deployments,
      bots,
      generatedQuestions,
    ).execute({ deploymentKey: 'public-key' });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(result.value.starterQuestions).toEqual(['Manual?', 'Gerada?']);
  });
});
