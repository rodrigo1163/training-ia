import {
  Controller,
  MessageEvent,
  NotFoundException,
  Param,
  Sse,
  UseGuards,
} from '@nestjs/common'
import { Observable } from 'rxjs'

import { BotRepository } from '@/domain/application/repositories/bot-repository'
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member'
import { OrganizationMemberContext } from '@/infra/http/decorators/organization-member.decorator'
import { OrganizationGuard } from '@/infra/http/guards/organization.guard'
import { DocumentStatusEventHub } from '@/infra/messaging/document-status-events'

@Controller('organization/:orgSlug/bots/:botSlug/fetch-data')
@UseGuards(OrganizationGuard)
export class DocumentStatusEventsController {
  constructor(
    private readonly bots: BotRepository,
    private readonly statusEvents: DocumentStatusEventHub,
  ) {}

  @Sse('events')
  async handle(
    @Param('botSlug') botSlug: string,
    @OrganizationMemberContext() organizationMember: OrganizationMember,
  ): Promise<Observable<MessageEvent>> {
    const bot = await this.bots.findBySlugAndOrgId(
      botSlug,
      organizationMember.orgId.toString(),
    )

    if (!bot) {
      throw new NotFoundException()
    }

    const botId = bot.id.toString()

    return new Observable<MessageEvent>((subscriber) => {
      const unsubscribe = this.statusEvents.subscribe(botId, (event) => {
        subscriber.next({
          type: event.type,
          data: event,
        })
      })

      subscriber.next({
        type: 'connected',
        data: { botId },
      })

      const heartbeat = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: {},
        })
      }, 25_000)

      return () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
    })
  }
}
