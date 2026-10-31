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
import type { ChatConfigPatch } from '@/domain/enterprise/entities/chat-config';
import { EditBotChatConfigUseCase } from '@/domain/application/use-cases/edit-bot-chat-config';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().max(max).nullable(),
  );

const nullableColor = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  z
    .string()
    .trim()
    .regex(
      /^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|rgba?\(\s*[\d.%+\-/\s,]+\)|hsla?\(\s*[\d.%+\-/\s,]+\))$/i,
    )
    .nullable(),
);

const starterQuestionsSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(3)
  .superRefine((questions, context) => {
    const normalized = questions.map((question) =>
      question.toLocaleLowerCase().replace(/\s+/g, ' '),
    );

    if (new Set(normalized).size !== normalized.length) {
      context.addIssue({
        code: 'custom',
        message: 'Starter questions must be unique.',
      });
    }
  });

const chatConfigPatchSchema = z
  .object({
    avatarUrl: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? null : value,
      z.url().max(2000).nullable(),
    ),
    inputPlaceholder: nullableText(120),
    submitButtonText: nullableText(40),
    showMessageTimestamps: z.boolean(),
    starterQuestions: starterQuestionsSchema,
    generateStarterQuestionsAfterResponse: z.boolean(),
    initialMessage: nullableText(2000),
    headerStatusText: nullableText(120),
    chatBackgroundColor: nullableColor,
    headerFooterBackgroundColor: nullableColor,
    assistantMessageBackgroundColor: nullableColor,
    userMessageBackgroundColor: nullableColor,
    model: nullableText(200),
    temperature: z.number().min(0).max(2).nullable(),
    maxTokens: z.number().int().positive().max(200_000).nullable(),
    maxMessagesPerDay: z.number().int().positive().max(1_000_000).nullable(),
    maxUserMessagesPerConversation: z
      .number()
      .int()
      .positive()
      .max(1_000_000)
      .nullable(),
  })
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one chat configuration field is required.',
  });

type ChatConfigPatchBody = z.infer<typeof chatConfigPatchSchema>;
const bodyValidationPipe = new ZodValidationPipe(chatConfigPatchSchema);

@Controller('organization/:orgSlug/bots/:botSlug/chat-config')
@UseGuards(OrganizationGuard)
export class EditBotChatConfigController {
  constructor(private readonly editChatConfig: EditBotChatConfigUseCase) {}

  @Patch()
  async handle(
    @Param('botSlug') botSlug: string,
    @Body(bodyValidationPipe) body: ChatConfigPatchBody,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ) {
    const result = await this.editChatConfig.execute({
      organizationMember,
      botSlug,
      patch: body as ChatConfigPatch,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException();
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
