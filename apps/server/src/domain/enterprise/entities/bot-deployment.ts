import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export const botDeploymentStatuses = ['ACTIVE', 'INACTIVE'] as const;
export type BotDeploymentStatus = (typeof botDeploymentStatuses)[number];

export class InvalidAllowedOriginsError extends Error {
  constructor() {
    super('Allowed origins must contain between 1 and 20 unique HTTP(S) origins.');
  }
}

export function normalizeAllowedOrigins(origins: string[]): string[] {
  const normalized = origins.map((origin) => {
    let url: URL;

    try {
      url = new URL(origin);
    } catch {
      throw new InvalidAllowedOriginsError();
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new InvalidAllowedOriginsError();
    }

    return url.origin;
  });

  const unique = [...new Set(normalized)];

  if (unique.length < 1 || unique.length > 20) {
    throw new InvalidAllowedOriginsError();
  }

  return unique;
}

export interface BotDeploymentProps {
  botId: UniqueEntityId;
  publicKey: string;
  status: BotDeploymentStatus;
  allowedOrigins: string[];
  createdAt: Date;
  updatedAt: Date | null;
}

export class BotDeployment extends Entity<BotDeploymentProps> {
  get botId() { return this.props.botId; }
  get publicKey() { return this.props.publicKey; }
  get status() { return this.props.status; }
  get allowedOrigins() { return this.props.allowedOrigins; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  set status(status: BotDeploymentStatus) {
    this.props.status = status;
    this.touch();
  }

  set allowedOrigins(origins: string[]) {
    this.props.allowedOrigins = normalizeAllowedOrigins(origins);
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<BotDeploymentProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ) {
    return new BotDeployment(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        allowedOrigins: normalizeAllowedOrigins(props.allowedOrigins),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
