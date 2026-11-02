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
import {
  MAX_CHAT_MESSAGE_LIMIT,
  type ChatConfigPatch,
} from '@/domain/enterprise/entities/chat-config';
import { EditBotChatConfigUseCase } from '@/domain/application/use-cases/edit-bot-chat-config';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';

const chatConfigPatchSchema = z
  .object({
    inputPlaceholder: z.string().nullable(),
    submitButtonText: z.string().nullable(),
    showMessageTimestamps: z.boolean(),
    starterQuestions: z.array(z.string()),
    generateStarterQuestionsAfterResponse: z.boolean(),
    initialMessage: z.string().nullable(),
    headerStatusText: z.string().nullable(),
    chatBackgroundColor: z.string().nullable(),
    headerFooterBackgroundColor: z.string().nullable(),
    footerBackgroundColor: z.string().nullable(),
    inputBackgroundColor: z.string().nullable(),
    inputTextColor: z.string().nullable(),
    starterQuestionsTextColor: z.string().nullable(),
    assistantMessageBackgroundColor: z.string().nullable(),
    userMessageBackgroundColor: z.string().nullable(),
    chatWidth: z.number().int().nullable(),
    chatHeight: z.number().int().nullable(),
    chatRadius: z.number().int().nullable(),
    messageRadius: z.number().int().nullable(),
    chatShadow: z.string().nullable(),
    floatingPosition: z.string().nullable(),
    model: z.string().nullable(),
    temperature: z.number().nullable(),
    maxTokens: z.number().nullable(),
    maxMessagesPerDay: z
      .number({ error: 'Max messages per day must be a number.' })
      .int({ error: 'Max messages per day must be an integer.' })
      .min(1, { error: 'Max messages per day must be at least 1.' })
      .max(MAX_CHAT_MESSAGE_LIMIT, {
        error: `Max messages per day must be at most ${MAX_CHAT_MESSAGE_LIMIT}.`,
      })
      .nullable(),
    maxUserMessagesPerConversation: z
      .number({
        error: 'Max user messages per conversation must be a number.',
      })
      .int({
        error: 'Max user messages per conversation must be an integer.',
      })
      .min(1, {
        error: 'Max user messages per conversation must be at least 1.',
      })
      .max(MAX_CHAT_MESSAGE_LIMIT, {
        error: `Max user messages per conversation must be at most ${MAX_CHAT_MESSAGE_LIMIT}.`,
      })
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

      throw new BadRequestException(error.message);
    }

    return { bot: BotPresenter.toHTTP(result.value.bot) };
  }
}
