import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { GoogleCalendarPushEventsService } from 'src/modules/calendar/calendar-event-push-manager/drivers/google-calendar/services/google-calendar-push-events.service';
import { CalendarEventPushJob } from 'src/modules/calendar/calendar-event-push-manager/jobs/calendar-event-push.job';
import { CalendarEventPushListener } from 'src/modules/calendar/calendar-event-push-manager/listeners/calendar-event-push.listener';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectedAccountEntity, CalendarChannelEntity]),
    GlobalWorkspaceDataSourceModule,
    OAuth2ClientManagerModule,
    TwentyConfigModule,
  ],
  providers: [
    GoogleCalendarPushEventsService,
    CalendarEventPushJob,
    CalendarEventPushListener,
  ],
  exports: [],
})
export class CalendarEventPushManagerModule {}
