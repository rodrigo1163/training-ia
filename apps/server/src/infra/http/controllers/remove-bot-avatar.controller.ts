import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { RemoveBotAvatarUseCase } from '@/domain/application/use-cases/remove-bot-avatar';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';

@Controller('organization/:orgSlug/bots/:botSlug/avatar')
@UseGuards(OrganizationGuard)
export class RemoveBotAvatarController {
  constructor(private readonly removeAvatar: RemoveBotAvatarUseCase) {}

  @Delete()
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.removeAvatar.execute({
      organizationMember,
      botSlug,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
