import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { BotRepository } from '../repositories/bot-repository';
import { Uploader } from '../storage/uploader';
import { inspectAvatarImage, InvalidAvatarFileError } from './avatar-image';

export interface UploadBotAvatarRequest {
  organizationMember: OrganizationMember;
  botSlug: string;
  fileType: string;
  size: number;
  body: Buffer;
}

type UploadBotAvatarResponse = Either<
  ResourceNotFoundError | InvalidAvatarFileError,
  { bot: import('../../enterprise/entities/bot').Bot }
>;

@Injectable()
export class UploadBotAvatarUseCase {
  constructor(
    private readonly bots: BotRepository,
    private readonly uploader: Uploader,
  ) {}

  async execute({
    organizationMember,
    botSlug,
    fileType,
    size,
    body,
  }: UploadBotAvatarRequest): Promise<UploadBotAvatarResponse> {
    let imageInfo;
    try {
      imageInfo = inspectAvatarImage(body, fileType, size);
    } catch (error) {
      if (error instanceof InvalidAvatarFileError) return left(error);
      throw error;
    }

    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    );
    if (!bot) return left(new ResourceNotFoundError());

    const storageKey = `chat-avatars/${bot.id.toString()}/${randomUUID()}.${imageInfo.extension}`;
    await this.uploader.upload({
      key: storageKey,
      contentType: imageInfo.contentType,
      body,
    });

    const previousStorageKey = bot.chatConfig.avatarStorageKey;
    const configError = bot.updateChatConfig({
      avatarUrl: this.uploader.publicUrl({ key: storageKey }),
      avatarStorageKey: storageKey,
    });

    if (configError) {
      await this.uploader.deleteObject({ key: storageKey });
      return left(configError);
    }

    await this.bots.update(bot);

    if (previousStorageKey && previousStorageKey !== storageKey) {
      await this.uploader.deleteObject({ key: previousStorageKey });
    }

    return right({ bot });
  }
}
