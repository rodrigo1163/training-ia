import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';
import { UploadBotWebsiteUseCase } from '@/domain/application/use-cases/upload-bot-website';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { WebsiteFetchError } from '@/domain/application/use-cases/errors/website-fetch-error';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';

const uploadBotWebsiteBodySchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    }, 'URL must use HTTP or HTTPS'),
});

type UploadBotWebsiteBody = z.infer<typeof uploadBotWebsiteBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(uploadBotWebsiteBodySchema);

@Controller('organization/:orgSlug/bots/:botSlug/upload-website-bot')
@UseGuards(OrganizationGuard)
export class UploadBotWebsiteController {
  constructor(private readonly uploadWebsite: UploadBotWebsiteUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: UploadBotWebsiteBody,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.uploadWebsite.execute({
      organizationMember,
      botSlug,
      url: body.url,
    });

    if (result.isLeft()) {
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case WebsiteFetchError:
          throw new BadGatewayException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { documentId: result.value.document.id.toString() };
  }
}
