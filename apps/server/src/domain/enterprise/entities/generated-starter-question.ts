import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export const generatedStarterQuestionStatuses = ['AVAILABLE', 'USED'] as const;
export type GeneratedStarterQuestionStatus =
  (typeof generatedStarterQuestionStatuses)[number];

export interface GeneratedStarterQuestionProps {
  botId: UniqueEntityId;
  idempotencyKey: string;
  originalText: string;
  normalizedText: string;
  status: GeneratedStarterQuestionStatus;
  createdAt: Date;
}

export function normalizeStarterQuestion(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export class GeneratedStarterQuestion extends Entity<GeneratedStarterQuestionProps> {
  get botId() {
    return this.props.botId;
  }

  get idempotencyKey() {
    return this.props.idempotencyKey;
  }

  get originalText() {
    return this.props.originalText;
  }

  get normalizedText() {
    return this.props.normalizedText;
  }

  get status() {
    return this.props.status;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  markUsed() {
    this.props.status = 'USED';
  }

  static create(
    props: Optional<
      GeneratedStarterQuestionProps,
      'normalizedText' | 'status' | 'createdAt'
    >,
    id?: UniqueEntityId,
  ) {
    const originalText = props.originalText.trim().replace(/\s+/g, ' ');

    return new GeneratedStarterQuestion(
      {
        ...props,
        idempotencyKey: props.idempotencyKey,
        originalText,
        normalizedText:
          props.normalizedText ?? normalizeStarterQuestion(originalText),
        status: props.status ?? 'AVAILABLE',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
