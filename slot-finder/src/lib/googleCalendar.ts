import { MeetingDetails } from '../types';

export const createCalendarEvent = async (
  token: string,
  meeting: Omit<MeetingDetails, 'id' | 'status'>
) => {
  try {
    // Format the event according to Google Calendar API
    const event = {
      summary: meeting.title,
      description: meeting.description,
      start: {
        dateTime: meeting.startTime,
        timeZone: 'UTC', // You might want to make this configurable
      },
      end: {
        dateTime: meeting.endTime,
        timeZone: 'UTC',
      },
      attendees: meeting.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: window.crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }

    const data = await response.json();
    return {
      id: data.id,
      meetingUrl: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || '',
      calendarEvent: data,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

export const checkCalendarAvailability = async (
  token: string,
  timeMin: string,
  timeMax: string,
  timeZone: string = 'UTC'
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          timeZone,
          items: [{ id: 'primary' }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to check calendar availability:', error);
      throw new Error('Failed to check calendar availability');
    }

    const data = await response.json();
    return data.calendars?.primary?.busy || [];
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    throw error;
  }
};
