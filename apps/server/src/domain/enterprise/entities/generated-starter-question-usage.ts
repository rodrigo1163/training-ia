import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export interface GeneratedStarterQuestionUsageProps {
  generatedStarterQuestionId: UniqueEntityId;
  conversationId: UniqueEntityId;
  shownAt: Date;
  clickedAt: Date | null;
}

export class GeneratedStarterQuestionUsage extends Entity<GeneratedStarterQuestionUsageProps> {
  get generatedStarterQuestionId() {
    return this.props.generatedStarterQuestionId;
  }

  get conversationId() {
    return this.props.conversationId;
  }

  get shownAt() {
    return this.props.shownAt;
  }

  get clickedAt() {
    return this.props.clickedAt;
  }

  markClicked(at = new Date()) {
    this.props.clickedAt = at;
  }

  static create(
    props: Optional<GeneratedStarterQuestionUsageProps, 'shownAt' | 'clickedAt'>,
    id?: UniqueEntityId,
  ) {
    return new GeneratedStarterQuestionUsage(
      {
        ...props,
        shownAt: props.shownAt ?? new Date(),
        clickedAt: props.clickedAt ?? null,
      },
      id,
    );
  }
}
