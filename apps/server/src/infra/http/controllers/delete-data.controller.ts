import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { DeleteDataUseCase } from '@/domain/application/use-cases/delete-data';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class DeleteDataController {
  constructor(private readonly deleteData: DeleteDataUseCase) {}

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ): Promise<void> {
    const result = await this.deleteData.execute({
      organizationMember,
      botSlug,
      documentId,
    });

    if (result.isLeft()) {
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message);
      }

    }
  }
}
