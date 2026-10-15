import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import z from 'zod';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { botDeploymentStatuses, InvalidAllowedOriginsError } from '@/domain/enterprise/entities/bot-deployment';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeploymentAlreadyExistsError } from '@/domain/application/use-cases/errors/deployment-already-exists-error';
import { GetBotDeploymentUseCase } from '@/domain/application/use-cases/get-bot-deployment';
import { PublishBotDeploymentUseCase } from '@/domain/application/use-cases/publish-bot-deployment';
import { EditBotDeploymentUseCase } from '@/domain/application/use-cases/edit-bot-deployment';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotDeploymentPresenter } from '@/infra/http/presenters/bot-deployment-presenter';

const originsSchema = z.array(z.string().trim().min(1)).min(1).max(20);
const publishBodyPipe = new ZodValidationPipe(z.object({ allowedOrigins: originsSchema }));
const editSchema = z.object({ allowedOrigins: originsSchema.optional(), status: z.enum(botDeploymentStatuses).optional() }).refine((value) => value.allowedOrigins !== undefined || value.status !== undefined);
const editBodyPipe = new ZodValidationPipe(editSchema);

@Controller('organization/:orgSlug/bots/:botSlug/deployment')
@UseGuards(OrganizationGuard)
export class BotDeploymentController {
  constructor(
    private readonly getDeployment: GetBotDeploymentUseCase,
    private readonly publishDeployment: PublishBotDeploymentUseCase,
    private readonly editDeployment: EditBotDeploymentUseCase,
  ) {}

  @Get()
  async get(@Param('botSlug') botSlug: string, @OrganizationMemberContext() organizationMember: OrganizationMember) {
    const result = await this.getDeployment.execute({ botSlug, organizationMember });
    if (result.isLeft()) throw new NotFoundException(result.value.message);
    return { deployment: result.value.deployment ? BotDeploymentPresenter.toHTTP(result.value.deployment) : null };
  }

  @Post()
  async publish(@Param('botSlug') botSlug: string, @Body(publishBodyPipe) body: { allowedOrigins: string[] }, @OrganizationMemberContext() organizationMember: OrganizationMember) {
    try {
      const result = await this.publishDeployment.execute({ botSlug, organizationMember, allowedOrigins: body.allowedOrigins });
      if (result.isRight()) return { deployment: BotDeploymentPresenter.toHTTP(result.value.deployment) };
      return this.throwUseCaseError(result.value);
    } catch (error) {
      if (error instanceof InvalidAllowedOriginsError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Patch()
  async edit(@Param('botSlug') botSlug: string, @Body(editBodyPipe) body: { allowedOrigins?: string[]; status?: 'ACTIVE' | 'INACTIVE' }, @OrganizationMemberContext() organizationMember: OrganizationMember) {
    try {
      const result = await this.editDeployment.execute({ botSlug, organizationMember, ...body });
      if (result.isRight()) return { deployment: BotDeploymentPresenter.toHTTP(result.value.deployment) };
      return this.throwUseCaseError(result.value);
    } catch (error) {
      if (error instanceof InvalidAllowedOriginsError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private throwUseCaseError(error: Error): never {
    if (error instanceof ResourceNotFoundError) throw new NotFoundException(error.message);
    if (error instanceof DeploymentAlreadyExistsError) throw new ConflictException(error.message);
    throw new BadRequestException(error.message);
  }
}
