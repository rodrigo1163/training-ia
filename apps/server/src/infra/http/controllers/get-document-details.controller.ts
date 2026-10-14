import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetDocumentDetailsUseCase } from '@/domain/application/use-cases/get-document-details';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { DocumentDetailsPresenter } from '@/infra/http/presenters/document-details-presenter';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class GetDocumentDetailsController {
  constructor(
    private readonly getDocumentDetails: GetDocumentDetailsUseCase,
  ) {}

  @Get(':documentId')
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.getDocumentDetails.execute({
      organizationMember,
      botSlug,
      documentId,
    });

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }

    const fileUrl = `/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/fetch-data/${encodeURIComponent(documentId)}/file`;

    return DocumentDetailsPresenter.toHTTP(
      result.value.document,
      fileUrl,
    );
  }
}
