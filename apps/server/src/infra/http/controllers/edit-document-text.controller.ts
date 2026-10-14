import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { EditDocumentTextUseCase } from '@/domain/application/use-cases/edit-document-text';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';

@Controller('organization/:orgSlug/bots/:botSlug/data')
@UseGuards(OrganizationGuard)
export class EditDocumentTextController {
  constructor(private readonly editDocumentText: EditDocumentTextUseCase) {}

  @Patch(':documentId')
  async handle(
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @Body('text') text: string | undefined,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.editDocumentText.execute({
      organizationMember,
      botSlug,
      documentId,
      text: text ?? '',
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
      documentId: result.value.document.id.toString(),
      status: result.value.document.status,
    };
  }
}
