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
  chatFontFamilies,
  chatMessageFontSizes,
  launcherIcons,
  chatShadows,
  floatingPositions,
  CHAT_STYLE_LIMITS,
  CHAT_COLOR_FIELDS,
} from '@/domain/enterprise/entities/bot-style';
import { MAX_CHAT_MESSAGE_LIMIT } from '@/domain/enterprise/entities/chat-config';
import type { BotChatConfigPatch } from '@/domain/enterprise/entities/bot';
import { EditBotChatConfigUseCase } from '@/domain/application/use-cases/edit-bot-chat-config';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { OrganizationGuard } from '@/infra/http/guards/organization.guard';
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { BotPresenter } from '@/infra/http/presenters/bot-presenter';

const colorPaletteShape = Object.fromEntries(
  CHAT_COLOR_FIELDS.map((field) => [field, z.string().nullable()]),
) as Record<(typeof CHAT_COLOR_FIELDS)[number], z.ZodNullable<z.ZodString>>;

const colorPaletteSchema = z.object(colorPaletteShape).strict();

const styleSchema = z
  .object({
    avatarUrl: z.string().nullable(),
    colors: z
      .object({
        light: colorPaletteSchema,
        dark: colorPaletteSchema,
      })
      .strict(),
    launcherSize: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.launcherSize.min)
      .max(CHAT_STYLE_LIMITS.launcherSize.max)
      .nullable()
      .refine(
        (value) =>
          value === null ||
          (value - CHAT_STYLE_LIMITS.launcherSize.min) %
            CHAT_STYLE_LIMITS.launcherSize.step ===
            0,
        {
          message: 'Launcher size must be 48, 52, 56, 60, 64, 68, or 72 px.',
        },
      ),
    launcherIcon: z.enum(launcherIcons).nullable(),
    chatBorderWidth: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.chatBorderWidth.min)
      .max(CHAT_STYLE_LIMITS.chatBorderWidth.max)
      .nullable(),
    chatFontFamily: z.enum(chatFontFamilies).nullable(),
    chatMessageFontSize: z.enum(chatMessageFontSizes).nullable(),
    chatWidth: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.chatWidth.min)
      .max(CHAT_STYLE_LIMITS.chatWidth.max)
      .nullable(),
    chatHeight: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.chatHeight.min)
      .max(CHAT_STYLE_LIMITS.chatHeight.max)
      .nullable(),
    chatRadius: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.chatRadius.min)
      .max(CHAT_STYLE_LIMITS.chatRadius.max)
      .nullable(),
    messageRadius: z
      .number()
      .int()
      .min(CHAT_STYLE_LIMITS.messageRadius.min)
      .max(CHAT_STYLE_LIMITS.messageRadius.max)
      .nullable(),
    chatShadow: z.enum(chatShadows).nullable(),
    floatingPosition: z.enum(floatingPositions).nullable(),
  })
  .strict();

const chatConfigPatchSchema = z
  .object({
    inputPlaceholder: z.string().nullable(),
    submitButtonText: z.string().nullable(),
    showMessageTimestamps: z.boolean(),
    starterQuestions: z.array(z.string()),
    generateStarterQuestionsAfterResponse: z.boolean(),
    initialMessage: z.string().nullable(),
    headerStatusText: z.string().nullable(),
    style: styleSchema,
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
      patch: body as BotChatConfigPatch,
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
