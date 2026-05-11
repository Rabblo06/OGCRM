import { Injectable, Logger } from '@nestjs/common';

import { google } from 'googleapis';

import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';
import { OAuth2ClientManagerService } from 'src/modules/connected-account/oauth2-client-manager/services/oauth2-client-manager.service';

@Injectable()
export class GoogleCalendarPushEventsService {
  private readonly logger = new Logger(GoogleCalendarPushEventsService.name);

  constructor(
    private readonly oAuth2ClientManagerService: OAuth2ClientManagerService,
  ) {}

  async createEvent(
    connectedAccount: Pick<
      ConnectedAccountEntity,
      'provider' | 'refreshToken' | 'id'
    >,
    calendarEvent: CalendarEventWorkspaceEntity,
  ): Promise<string | null> {
    try {
      const oAuth2Client =
        await this.oAuth2ClientManagerService.getGoogleOAuth2Client(
          connectedAccount,
        );

      const googleCalendarClient = google.calendar({
        version: 'v3',
        auth: oAuth2Client,
      });

      const eventBody = this.buildEventBody(calendarEvent);

      const response = await googleCalendarClient.events.insert({
        calendarId: 'primary',
        requestBody: eventBody,
      });

      return response.data.id ?? null;
    } catch (error) {
      this.logger.error('Failed to create event in Google Calendar', error);
      return null;
    }
  }

  async updateEvent(
    connectedAccount: Pick<
      ConnectedAccountEntity,
      'provider' | 'refreshToken' | 'id'
    >,
    externalEventId: string,
    calendarEvent: CalendarEventWorkspaceEntity,
  ): Promise<void> {
    try {
      const oAuth2Client =
        await this.oAuth2ClientManagerService.getGoogleOAuth2Client(
          connectedAccount,
        );

      const googleCalendarClient = google.calendar({
        version: 'v3',
        auth: oAuth2Client,
      });

      const eventBody = this.buildEventBody(calendarEvent);

      await googleCalendarClient.events.patch({
        calendarId: 'primary',
        eventId: externalEventId,
        requestBody: eventBody,
      });
    } catch (error) {
      this.logger.error('Failed to update event in Google Calendar', error);
    }
  }

  private buildEventBody(calendarEvent: CalendarEventWorkspaceEntity) {
    const body: Record<string, unknown> = {
      summary: calendarEvent.title ?? 'Untitled Event',
    };

    if (calendarEvent.description) {
      body.description = calendarEvent.description;
    }

    if (calendarEvent.location) {
      body.location = calendarEvent.location;
    }

    if (calendarEvent.isFullDay) {
      body.start = {
        date: calendarEvent.startsAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      };
      body.end = {
        date: calendarEvent.endsAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      };
    } else {
      body.start = calendarEvent.startsAt
        ? { dateTime: calendarEvent.startsAt, timeZone: 'UTC' }
        : undefined;
      body.end = calendarEvent.endsAt
        ? { dateTime: calendarEvent.endsAt, timeZone: 'UTC' }
        : undefined;
    }

    return body;
  }
}
