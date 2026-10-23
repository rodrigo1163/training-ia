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
import { GetDataFileUseCase } from '@/domain/application/use-cases/get-data-file';
import { StorageDownloadError } from '@/domain/application/use-cases/errors/storage-download-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class GetDataFileController {
  constructor(
    private readonly getDataFile: GetDataFileUseCase,
  ) {}

  @Get(':documentId/file')
  async handle(
    @Param('botSlug') botSlug: string,
    @Param('documentId') documentId: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.getDataFile.execute({
      organizationMember,
      botSlug,
      documentId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
        case StorageDownloadError:
          throw new NotFoundException(error.message);
        default:
          throw new NotFoundException();
      }
    }

    response.set({
      'Content-Disposition': `inline; filename="${result.value.document.name}"`,
      'Content-Type':
        result.value.file.contentType ?? result.value.document.contentType,
    });

    return new StreamableFile(result.value.file.body);
  }
}
