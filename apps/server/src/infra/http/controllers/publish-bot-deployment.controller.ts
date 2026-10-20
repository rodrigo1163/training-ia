import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { DeploymentAlreadyExistsError } from '@/domain/application/use-cases/errors/deployment-already-exists-error';
import { PublishBotDeploymentUseCase } from '@/domain/application/use-cases/publish-bot-deployment';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { BotDeploymentPresenter } from '@/infra/http/presenters/bot-deployment-presenter';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const publishBodySchema = z.object({
  allowedOrigins: z
    .array(
      z
        .url()
        .refine(
          (origin) => ['http:', 'https:'].includes(new URL(origin).protocol),
          { message: 'Origin must use HTTP or HTTPS.' },
        ),
    )
    .min(1)
    .max(20),
});
type PublishBotDeploymentBody = z.infer<typeof publishBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(publishBodySchema);

@Controller('organization/:orgSlug/bots/:botSlug/deployment')
@UseGuards(OrganizationGuard)
export class PublishBotDeploymentController {
  constructor(
    private readonly publishDeployment: PublishBotDeploymentUseCase,
  ) {}

  @Post()
  async handle(
    @Param('botSlug') botSlug: string,
    @Body(bodyValidationPipe) body: PublishBotDeploymentBody,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.publishDeployment.execute({
      botSlug,
      organizationMember,
      allowedOrigins: body.allowedOrigins,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case DeploymentAlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      deployment: BotDeploymentPresenter.toHTTP(result.value.deployment),
    };
  }
}
