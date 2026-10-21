import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetDocumentDetailsUseCase } from '@/domain/application/use-cases/get-document-details';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { Uploader } from '@/domain/application/storage/uploader';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class GetDataFileController {
  constructor(
    private readonly getDocumentDetails: GetDocumentDetailsUseCase,
    private readonly storage: Uploader,
  ) {}

  @Get(':documentId/file')
  async handle(
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.getDocumentDetails.execute({
      organizationMember,
      botSlug,
      documentId,
    });

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }

    try {
      const file = await this.storage.download({
        key: result.value.document.storageKey,
      });

      response.set({
        'Content-Disposition': `inline; filename="${result.value.document.name}"`,
        'Content-Type': file.contentType ?? result.value.document.contentType,
      });

      return new StreamableFile(file.body);
    } catch {
      throw new NotFoundException('Unable to load the PDF.');
    }
  }
}
