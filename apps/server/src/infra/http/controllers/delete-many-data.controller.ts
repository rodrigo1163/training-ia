import { DeleteManyDataUseCase } from '@/domain/application/use-cases/delete-many-data';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import z from 'zod';

const deleteManyDataBodySchema = z.object({
  documentIds: z.array(z.string().min(1)).min(1),
});

type DeleteManyDataBody = z.infer<typeof deleteManyDataBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(deleteManyDataBodySchema);

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class DeleteManyDataController {
  constructor(private readonly deleteManyData: DeleteManyDataUseCase) { }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Body(bodyValidationPipe) body: DeleteManyDataBody,
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ): Promise<void> {
    const result = await this.deleteManyData.execute({
      organizationMember,
      botSlug,
      documentIds: body.documentIds,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
