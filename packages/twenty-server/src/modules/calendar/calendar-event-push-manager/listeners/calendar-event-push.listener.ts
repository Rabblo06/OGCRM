import { Injectable } from '@nestjs/common';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  CalendarEventPushJob,
  type CalendarEventPushJobData,
} from 'src/modules/calendar/calendar-event-push-manager/jobs/calendar-event-push.job';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';

@Injectable()
export class CalendarEventPushListener {
  constructor(
    @InjectMessageQueue(MessageQueue.calendarQueue)
    private readonly calendarQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('calendarEvent', DatabaseEventAction.CREATED)
  @OnDatabaseBatchEvent('calendarEvent', DatabaseEventAction.UPDATED)
  async handleCalendarEventCreatedOrUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<CalendarEventWorkspaceEntity>
    >,
  ): Promise<void> {
    if (!isDefined(payload.workspaceId)) {
      return;
    }

    await Promise.all(
      payload.events.map((event) => {
        // Skip events that originated from the sync (have iCalUid already set on create)
        if (
          DatabaseEventAction.CREATED &&
          isDefined(event.properties.after?.iCalUid)
        ) {
          return;
        }

        return this.calendarQueueService.add<CalendarEventPushJobData>(
          CalendarEventPushJob.name,
          {
            workspaceId: payload.workspaceId,
            calendarEventId: event.recordId,
            userWorkspaceId: event.userWorkspaceId,
          },
        );
      }),
    );
  }
}
