import { useState, useCallback } from 'react';
import { MeetingDetails } from '../types';
import { useAuthContext } from '../context/AuthContext';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  status: string;
  source: 'google' | 'local';
}

export function useCalendar() {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const { token, refreshToken: refreshAuthToken } = useAuthContext();

  // Helper function to get current token
  const getCurrentToken = async (): Promise<string> => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return token;
  };

  // Helper function to make API calls with automatic token refresh
  const apiCallWithTokenRefresh = async (url: string, options: RequestInit): Promise<Response> => {
    try {
      let currentToken = await getCurrentToken();
      
      // First attempt with current token
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      };
      
      let response = await fetch(url, { ...options, headers });
      
      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        console.log('Token expired, attempting to refresh...');
        try {
          const newToken = await refreshAuthToken();
          if (!newToken) throw new Error('Failed to refresh token');
          
          // Retry with fresh token
          const refreshedHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          };
          response = await fetch(url, { ...options, headers: refreshedHeaders });
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Authentication failed. Please sign in again.');
        }
      }
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const createEvent = async (meetingDetails: MeetingDetails) => {
    setIsCreating(true);
    
    try {
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

      const response = await apiCallWithTokenRefresh('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
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

      // Add the created event to local state
      const localEvent: GoogleCalendarEvent = {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        attendees: createdEvent.attendees,
        status: createdEvent.status,
        source: 'google'
      };
      setEvents(prev => [...prev, localEvent]);
      
      return createdEvent;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    
    try {
      // Check authentication first
      let token;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['google_access_token']);
        token = result.google_access_token;
      } else {
        // Fallback for development
        token = localStorage.getItem('google_access_token');
      }

      if (!token || token === 'dev-token') {
        // Return mock events for development/unauthenticated users
        const mockEvents: GoogleCalendarEvent[] = [
          {
            id: 'mock-1',
            summary: 'Team Standup',
            description: 'Daily team standup meeting',
            start: {
              dateTime: new Date(startDate.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9 AM
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(startDate.getTime() + 9.5 * 60 * 60 * 1000).toISOString(), // 9:30 AM
              timeZone: 'UTC'
            },
            attendees: [{ email: 'team@company.com' }],
            status: 'confirmed',
            source: 'google'
          },
          {
            id: 'mock-2',
            summary: 'Project Review',
            description: 'Weekly project review meeting',
            start: {
              dateTime: new Date(startDate.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2 PM
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(startDate.getTime() + 15 * 60 * 60 * 1000).toISOString(), // 3 PM
              timeZone: 'UTC'
            },
            attendees: [{ email: 'manager@company.com' }],
            status: 'confirmed',
            source: 'google'
          }
        ];
        setEvents(mockEvents);
        return mockEvents;
      }

      // Fetch real Google Calendar events
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const googleEvents: GoogleCalendarEvent[] = data.items.map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Untitled Event',
        description: item.description,
        start: item.start,
        end: item.end,
        attendees: item.attendees,
        status: item.status,
        source: 'google' as const
      }));

      setEvents(googleEvents);
      return googleEvents;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      setEvents([]); // Clear events on error
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEventsForTimeSlot = useCallback((time: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      const slotTime = new Date(time);
      
      // Check if the time slot overlaps with the event
      return (
        slotTime >= eventStart &&
        slotTime < eventEnd
      );
    });
  }, [events]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      let token;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['google_access_token']);
        token = result.google_access_token;
      } else {
        token = localStorage.getItem('google_access_token');
      }

      if (!token || token === 'dev-token') {
        // For development/mock events, just remove from local state
        setEvents(prev => prev.filter(event => event.id !== eventId));
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete calendar event');
      }

      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }, []);

  return {
    createEvent,
    fetchEvents,
    deleteEvent,
    getEventsForTimeSlot,
    events,
    isCreating,
    isLoading
  };
}
