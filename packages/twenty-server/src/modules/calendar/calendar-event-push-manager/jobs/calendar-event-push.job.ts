import { Logger, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { GoogleCalendarPushEventsService } from 'src/modules/calendar/calendar-event-push-manager/drivers/google-calendar/services/google-calendar-push-events.service';
import { type CalendarChannelEventAssociationWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-channel-event-association.workspace-entity';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';

export type CalendarEventPushJobData = {
  workspaceId: string;
  calendarEventId: string;
  userWorkspaceId?: string;
};

@Processor({ queueName: MessageQueue.calendarQueue, scope: Scope.REQUEST })
export class CalendarEventPushJob {
  private readonly logger = new Logger(CalendarEventPushJob.name);

  constructor(
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly googleCalendarPushEventsService: GoogleCalendarPushEventsService,
  ) {}

  @Process(CalendarEventPushJob.name)
  async handle(data: CalendarEventPushJobData): Promise<void> {
    const { workspaceId, calendarEventId, userWorkspaceId } = data;

    const calendarEventRepository =
      await this.globalWorkspaceOrmManager.getRepository<CalendarEventWorkspaceEntity>(
        workspaceId,
        'calendarEvent',
      );

    const calendarEvent = await calendarEventRepository.findOne({
      where: { id: calendarEventId },
    });

    if (!isDefined(calendarEvent)) {
      return;
    }

    let connectedAccount: ConnectedAccountEntity | null = null;

    if (isDefined(userWorkspaceId)) {
      connectedAccount = await this.connectedAccountRepository.findOne({
        where: {
          workspaceId,
          userWorkspaceId,
          provider: ConnectedAccountProvider.GOOGLE,
        },
      });
    }

    if (!isDefined(connectedAccount)) {
      connectedAccount = await this.connectedAccountRepository.findOne({
        where: { workspaceId, provider: ConnectedAccountProvider.GOOGLE },
      });
    }

    if (!isDefined(connectedAccount)) {
      this.logger.warn(
        `No Google connected account for workspace ${workspaceId}`,
      );
      return;
    }

    const calendarChannelEventAssociationRepository =
      await this.globalWorkspaceOrmManager.getRepository<CalendarChannelEventAssociationWorkspaceEntity>(
        workspaceId,
        'calendarChannelEventAssociation',
      );

    const existingAssociation =
      await calendarChannelEventAssociationRepository.findOne({
        where: { calendarEventId },
      });

    if (
      isDefined(existingAssociation) &&
      isDefined(existingAssociation.eventExternalId)
    ) {
      await this.googleCalendarPushEventsService.updateEvent(
        connectedAccount,
        existingAssociation.eventExternalId,
        calendarEvent,
      );
      return;
    }

    const calendarChannel = await this.calendarChannelRepository.findOne({
      where: { connectedAccountId: connectedAccount.id },
    });

    if (!isDefined(calendarChannel)) {
      this.logger.warn(
        `No calendar channel for connected account ${connectedAccount.id}`,
      );
      return;
    }

    const externalEventId =
      await this.googleCalendarPushEventsService.createEvent(
        connectedAccount,
        calendarEvent,
      );

    if (!isDefined(externalEventId)) {
      this.logger.error(
        `Failed to create Google Calendar event for workspace ${workspaceId}`,
      );
      return;
    }

    await calendarChannelEventAssociationRepository.save({
      eventExternalId: externalEventId,
      calendarChannelId: calendarChannel.id,
      calendarEventId,
    });
  }
}
