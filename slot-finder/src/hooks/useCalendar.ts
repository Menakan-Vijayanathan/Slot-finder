import { useState } from 'react';
import { MeetingDetails } from '../types';

export function useCalendar() {
  const [isCreating, setIsCreating] = useState(false);

  const createEvent = async (meetingDetails: MeetingDetails) => {
    setIsCreating(true);
    
    try {
      const token = await chrome.storage.local.get(['google_access_token']);
      if (!token.google_access_token) {
        throw new Error('Not authenticated');
      }

      const event = {
        summary: meetingDetails.title,
        description: meetingDetails.description,
        start: {
          dateTime: meetingDetails.startTime,
          timeZone: meetingDetails.timezone,
        },
        end: {
          dateTime: meetingDetails.endTime,
          timeZone: meetingDetails.timezone,
        },
        attendees: meetingDetails.attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.google_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create event');
      }

      const createdEvent = await response.json();
      
      // Show success notification
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Meeting Created',
        message: `"${meetingDetails.title}" has been added to your calendar`
      });

      return createdEvent;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEvent,
    isCreating
  };
}