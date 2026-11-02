import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { GeneratedStarterQuestionUsage } from './generated-starter-question-usage';

describe('GeneratedStarterQuestionUsage', () => {
  it('marks a shown question as clicked without changing its conversation', () => {
    const usage = GeneratedStarterQuestionUsage.create({
      generatedStarterQuestionId: new UniqueEntityId('question-1'),
      conversationId: new UniqueEntityId('conversation-1'),
    });

    expect(usage.clickedAt).toBeNull();
    usage.markClicked();

    expect(usage.clickedAt).toBeInstanceOf(Date);
    expect(usage.conversationId.toString()).toBe('conversation-1');
  });
});
