import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { GetBotDeploymentUseCase } from '@/domain/application/use-cases/get-bot-deployment';
import { BotDeploymentPresenter } from '@/infra/http/presenters/bot-deployment-presenter';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots/:botSlug/deployment')
@UseGuards(OrganizationGuard)
export class GetBotDeploymentController {
  constructor(private readonly getDeployment: GetBotDeploymentUseCase) {}

  @Get()
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.getDeployment.execute({
      botSlug,
      organizationMember,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException();
      }
    }

    if (!result.value.deployment) {
      return { deployment: null };
    }

    return {
      deployment: BotDeploymentPresenter.toHTTP(result.value.deployment),
    };
  }
}
