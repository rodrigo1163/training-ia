import { OrganizationMemberRepository } from '@/domain/application/repositories/organization-member-repository';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';

export type OrganizationRequest = Request & {
  params: Request['params'] & { orgSlug?: string };
  session?: UserSession;
  organizationMember?: OrganizationMember;
};

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private readonly organizationMembers: OrganizationMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OrganizationRequest>();
    const orgSlug = request.params.orgSlug;
    const userId = request.session?.user.id;

    if (!orgSlug || !userId) {
      throw new ForbiddenException();
    }

    const organizationMember =
      await this.organizationMembers.findByOrgSlugAndUserId(orgSlug, userId);

    if (!organizationMember) {
      throw new ForbiddenException();
    }

    request.organizationMember = organizationMember;

    return true;
  }
}
