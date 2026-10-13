import { BotNotEmptyError } from '@/core/errors/errors/bot-not-empty-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeleteBotUseCase } from '@/domain/application/use-cases/delete-bot';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots')
@UseGuards(OrganizationGuard)
export class DeleteBotController {
  constructor(private readonly deleteBot: DeleteBotUseCase) {}

  @Delete(':botSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ): Promise<void> {
    const result = await this.deleteBot.execute({
      organizationMember,
      botSlug,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case BotNotEmptyError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
