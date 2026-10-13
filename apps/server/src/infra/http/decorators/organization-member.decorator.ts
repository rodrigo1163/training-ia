import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { OrganizationRequest } from '@/infra/http/guards/organization.guard';

export const OrganizationMemberContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrganizationMember => {
    const request = context
      .switchToHttp()
      .getRequest<OrganizationRequest>();

    return request.organizationMember as OrganizationMember;
  },
);
