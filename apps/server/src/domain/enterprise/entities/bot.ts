import { Entity } from '@training-ia/core/entities/entity';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type { Optional } from '@training-ia/core/types/optional';
import { Slug } from '../value-objects/slug.js';

export const botPersonalities = [
  'NEUTRAL',
  'PROFESSIONAL',
  'FRIENDLY',
  'CONCISE',
  'DETAILED',
  'EMPATHETIC',
  'PLAYFUL',
  'TECHNICAL',
  'EDUCATIONAL',
] as const;

export type BotPersonality = (typeof botPersonalities)[number];

export interface BotProps {
  orgId: UniqueEntityId;
  name: string;
  description: string | null;
  personality: BotPersonality;
  language: string;
  systemMessage: string | null;
  slug: Slug;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export class Bot extends Entity<BotProps> {
  get orgId() {
    return this.props.orgId;
  }

  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get personality() {
    return this.props.personality;
  }

  get language() {
    return this.props.language;
  }

  get systemMessage() {
    return this.props.systemMessage;
  }

  get slug() {
    return this.props.slug;
  }

  get documentCount() {
    return this.props.documentCount;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set personality(personality: BotPersonality) {
    this.props.personality = personality;
    this.touch();
  }

  set language(language: string) {
    this.props.language = language;
    this.touch();
  }

  set systemMessage(systemMessage: string | null) {
    this.props.systemMessage = systemMessage;
    this.touch();
  }

  static create(
    props: Optional<
      BotProps,
      | 'description'
      | 'personality'
      | 'language'
      | 'systemMessage'
      | 'slug'
      | 'documentCount'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityId,
  ) {
    return new Bot(
      {
        ...props,
        description: props.description ?? null,
        personality: props.personality ?? 'NEUTRAL',
        language: props.language ?? 'pt-BR',
        systemMessage: props.systemMessage ?? null,
        slug: props.slug ?? Slug.create(props.name),
        documentCount: props.documentCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
