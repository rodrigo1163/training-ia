import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '../../enterprise/entities/organization-member';
import { OrganizationRepository } from '../repositories/organization-repository';
import { Uploader } from '../storage/uploader';
import {
  InvalidAvatarFileError,
  MAX_AVATAR_FILE_SIZE,
} from './errors/invalid-avatar-file-error';

export interface UploadOrganizationLogoRequest {
  organizationMember: OrganizationMember;
  orgSlug: string;
  fileType: string;
  size: number;
  body: Buffer;
}

type UploadOrganizationLogoResponse = Either<
  ResourceNotFoundError | InvalidAvatarFileError,
  { logoUrl: string }
>;

@Injectable()
export class UploadOrganizationLogoUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly uploader: Uploader,
  ) {}

  async execute({
    organizationMember,
    orgSlug,
    fileType,
    size,
    body,
  }: UploadOrganizationLogoRequest): Promise<UploadOrganizationLogoResponse> {
    const contentType = fileType === 'image/jpg' ? 'image/jpeg' : fileType;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
      return left(
        new InvalidAvatarFileError(
          'Avatar must be a PNG, JPG, JPEG, or WebP image.',
        ),
      );
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_AVATAR_FILE_SIZE ||
      body.byteLength !== size
    ) {
      return left(
        new InvalidAvatarFileError('Avatar files must be at most 2 MB.'),
      );
    }

    const organization = await this.organizations.findBySlug(orgSlug);
    if (!organization || !organization.id.equals(organizationMember.orgId)) {
      return left(new ResourceNotFoundError());
    }

    const extension =
      contentType === 'image/jpeg' ? 'jpg' : contentType.slice(6);
    const storageKey = `organization-logos/${organization.id.toString()}/${randomUUID()}.${extension}`;

    await this.uploader.upload({
      key: storageKey,
      contentType,
      body,
    });

    const logoUrl = this.uploader.publicUrl({
      fallbackPath: '/public/organization/logo',
      key: storageKey,
    });

    try {
      organization.logo = logoUrl;
      await this.organizations.update(organization);
    } catch (error) {
      try {
        await this.uploader.deleteObject({ key: storageKey });
      } catch {
        // Keep the persistence error as the operation result.
      }

      throw error;
    }

    return right({ logoUrl });
  }
}
