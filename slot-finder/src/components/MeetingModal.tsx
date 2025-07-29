import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { TimeZone, MeetingDetails } from "../types";
import { useCalendar } from "../hooks/useCalendar";
import { X, Clock, Loader2 as Loader, Video, ExternalLink, AlertCircle } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { createCalendarEvent } from "../lib/googleCalendar";

interface MeetingDetailsWithId extends Omit<MeetingDetails, 'id' | 'status'> {
  id?: string;
  status?: string;
}

interface MeetingModalProps {
  selectedTime: Date;
  timezones: TimeZone[];
  onCreateMeeting: (meeting: MeetingDetails) => void;
  onClose: () => void;
  defaultMeetingDuration: number;
}

const MeetingModal: React.FC<MeetingModalProps> = ({
  selectedTime,
  timezones,
  onCreateMeeting,
  onClose,
  defaultMeetingDuration,
}) => {
  const selectedDateTime = DateTime.fromJSDate(selectedTime);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(selectedDateTime.toFormat("HH:mm"));
  const [endTime, setEndTime] = useState(selectedDateTime.plus({ minutes: defaultMeetingDuration || 60 }).toFormat("HH:mm"));
  const [attendees, setAttendees] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);

  const { createEvent } = useCalendar();
  const { 
    isSignedIn, 
    token, 
    refreshToken 
  } = useAuthContext();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Utility to get ISO string or fallback to empty string
  const safeToISO = (dt: DateTime) => dt.toISO() || dt.toFormat('yyyy-MM-dd\'T\'HH:mm:ss');

  const createGoogleCalendarEvent = async (meetingDetails: MeetingDetailsWithId) => {
    if (!isSignedIn || !token) {
      console.log('User not signed in or missing token');
      return null;
    }
    
    try {
      setIsCreatingEvent(true);
      setError(null);
      
      // Try to create the event with the current token
      try {
        const event = await createCalendarEvent(token, meetingDetails);
        setMeetingLink(event.meetingUrl);
        return event;
      } catch (err) {
        console.warn('Initial calendar event creation failed, checking if token needs refresh:', err);
        
        // If we get a 401, the token might be expired, so try to refresh it
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('token'))) {
          console.log('Token might be expired, attempting to refresh...');
          try {
            // Try to refresh the token
            const newToken = await refreshToken();
            if (newToken) {
              console.log('Token refreshed, retrying event creation...');
              const event = await createCalendarEvent(newToken, meetingDetails);
              setMeetingLink(event.meetingUrl);
              return event;
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            throw new Error('Failed to refresh authentication. Please sign in again.');
          }
        }
        
        // If we get here, either refresh failed or it wasn't a 401 error
        throw err;
      }
    } catch (err) {
      console.error('Failed to create Google Calendar event:', err);
      setError('Failed to create Google Calendar event. Please check your internet connection and try again.');
      return null;
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Generate timezone comparison text
  const timezoneComparison = timezones
    .map((tz) => {
      const timeInZone = selectedDateTime.setZone(tz.iana);
      return `${tz.name} (${tz.label}): ${timeInZone.toFormat("EEE, MMM d, yyyy - HH:mm")}`;
    })
    .join("\n");

  useEffect(() => {
    if (timezones.length > 1) {
      const primaryCity =
        timezones.find((tz) => tz.iana !== "Asia/Colombo")?.name || "Client";
      setTitle(`Meeting with ${primaryCity}`);
    }
    // Calculate duration in minutes
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    let duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (duration <= 0) duration += 24 * 60; // handle overnight
    setDescription(`Meeting Time Comparison:
${timezoneComparison}

Meeting details:
- Start: ${startTime}
- End: ${endTime}
- Duration: ${duration} minutes
- Google Meet link will be generated automatically`);
  }, [timezones, timezoneComparison, startTime, endTime]);

  const handleAddAttendee = () => {
    setAttendees([...attendees, ""]);
  };

  const handleRemoveAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const handleAttendeeChange = (index: number, email: string) => {
    const newAttendees = [...attendees];
    newAttendees[index] = email;
    setAttendees(newAttendees);
  };

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      // Compose start and end DateTime objects
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const startDateTime = selectedDateTime.set({ hour: startHour, minute: startMinute, second: 0 });
      let endDateTime = selectedDateTime.set({ hour: endHour, minute: endMinute, second: 0 });
      
      // If end is before start, assume next day
      if (endDateTime <= startDateTime) {
        endDateTime = endDateTime.plus({ days: 1 });
      }
      
      const validAttendees = attendees.filter((email) => email.trim() !== "");
      const meetingDetails: MeetingDetailsWithId = {
        title,
        description,
        startTime: safeToISO(startDateTime),
        endTime: safeToISO(endDateTime),
        attendees: validAttendees,
        timezone: "Asia/Colombo", // Default to Sri Lankan time
      };

      // Create Google Calendar event if user is signed in
      if (isSignedIn) {
        const googleEvent = await createGoogleCalendarEvent(meetingDetails);
        if (googleEvent?.meetingUrl) {
          // Update meeting details with Google Meet link
          meetingDetails.description = `${meetingDetails.description}\n\nGoogle Meet: ${googleEvent.meetingUrl}`;
        }
      }

      // Create local event
      // Create the final meeting details object with required fields
      const finalMeetingDetails: MeetingDetails = {
        title: meetingDetails.title,
        description: meetingDetails.description || '',
        startTime: meetingDetails.startTime,
        endTime: meetingDetails.endTime,
        attendees: meetingDetails.attendees,
        timezone: meetingDetails.timezone || 'Asia/Colombo',
      };
      
      // Create the event in local storage
      await createEvent(finalMeetingDetails);
      
      // Call the parent's onCreateMeeting with the final meeting details
      onCreateMeeting(finalMeetingDetails);
      
      // Don't close the modal if we have a meeting link to show
      if (!isSignedIn || !meetingLink) {
        onClose();
      }

      // Removed recent emails functionality as it was causing issues
      // and isn't critical for the core functionality
    } catch (error) {
      console.error("Failed to create meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Meeting
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meeting title"
            />
          </div>

          {/* Time Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Selected Time
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {timezones.map((tz) => {
                const timeInZone = selectedDateTime.setZone(tz.iana);
                return (
                  <div key={tz.id} className="flex justify-between">
                    <span>{tz.name}:</span>
                    <span className="font-medium">
                      {timeInZone.toFormat("EEE, MMM d - HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start and End Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attendees
            </label>
            {attendees.map((email, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleAttendeeChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
                {attendees.length > 1 && (
                  <button
                    onClick={() => handleRemoveAttendee(index)}
                    className="px-2 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddAttendee}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              + Add another attendee
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter meeting description"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {meetingLink && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Video className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Meeting created successfully!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-500"
                    >
                      Join Google Meet <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {!meetingLink && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            )}
            
            {!meetingLink ? (
              <button
                onClick={handleCreateMeeting}
                disabled={isCreating || isCreatingEvent || !title.trim()}
              >
                {(isCreating || isCreatingEvent) ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingEvent ? 'Creating Calendar Event...' : 'Creating Meeting...'}
                  </>
                ) : (
                  <>
                    {isSignedIn ? 'Create with Google Calendar' : 'Create Meeting'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
