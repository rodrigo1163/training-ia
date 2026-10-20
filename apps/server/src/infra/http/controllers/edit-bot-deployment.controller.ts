import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { botDeploymentStatuses } from '@/domain/enterprise/entities/bot-deployment';
import { ResourceNotFoundError } from '@training-ia/core/errors/errors/resource-not-found-error';
import { EditBotDeploymentUseCase } from '@/domain/application/use-cases/edit-bot-deployment';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { BotDeploymentPresenter } from '@/infra/http/presenters/bot-deployment-presenter';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';

const editBodySchema = z
  .object({
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
      .max(20)
      .optional(),
    status: z.enum(botDeploymentStatuses).optional(),
  })
  .refine(
    (value) => value.allowedOrigins !== undefined || value.status !== undefined,
  );
type EditBotDeploymentBody = z.infer<typeof editBodySchema>;
const bodyValidationPipe = new ZodValidationPipe(editBodySchema);

@Controller('organization/:orgSlug/bots/:botSlug/deployment')
@UseGuards(OrganizationGuard)
export class EditBotDeploymentController {
  constructor(private readonly editDeployment: EditBotDeploymentUseCase) {}

  @Patch()
  async handle(
    @Param('botSlug') botSlug: string,
    @Body(bodyValidationPipe) body: EditBotDeploymentBody,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.editDeployment.execute({
      botSlug,
      organizationMember,
      ...body,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      deployment: BotDeploymentPresenter.toHTTP(result.value.deployment),
    };
  }
}
