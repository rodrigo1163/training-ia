import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { GeneratedStarterQuestion } from '../../enterprise/entities/generated-starter-question';
import { selectStarterQuestions } from './select-starter-questions';

describe('select starter questions', () => {
  it('prioritizes configured questions and fills remaining slots with unique generated questions', () => {
    const result = selectStarterQuestions({
      configuredQuestions: ['Manual?', 'Outra manual?'],
      generatedQuestions: [
        GeneratedStarterQuestion.create({
          botId: new UniqueEntityId('bot-1'),
          idempotencyKey: 'key-1',
          originalText: ' manual? ',
          normalizedText: 'manual?',
        }),
        GeneratedStarterQuestion.create({
          botId: new UniqueEntityId('bot-1'),
          idempotencyKey: 'key-2',
          originalText: 'Gerada?',
          normalizedText: 'gerada?',
        }),
      ],
    });

    expect(result).toEqual(['Manual?', 'Outra manual?', 'Gerada?']);
  });
});
