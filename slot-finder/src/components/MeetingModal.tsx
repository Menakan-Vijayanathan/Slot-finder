import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { TimeZone, MeetingDetails } from "../types";
import { useCalendar } from "../hooks/useCalendar";
import { useWebStorage as useStorage } from "../hooks/useWebStorage";
import { X, Calendar, Clock, Loader } from "lucide-react";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(defaultMeetingDuration || 60);
  const [attendees, setAttendees] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);

  const [recentEmails] = useStorage<string[]>("recentEmails", []);
  const { createEvent } = useCalendar();

  const selectedDateTime = DateTime.fromJSDate(selectedTime);

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

    setDescription(`Meeting Time Comparison:
${timezoneComparison}

Meeting details:
- Duration: ${duration} minutes
- Google Meet link will be generated automatically`);
  }, [timezones, timezoneComparison, duration]);

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
      const startTime = selectedDateTime.toISO();
      const endTime = selectedDateTime.plus({ minutes: duration }).toISO();

      const validAttendees = attendees.filter((email) => email.trim() !== "");

      const meetingDetails: MeetingDetails = {
        title,
        description,
        startTime: startTime!,
        endTime: endTime!,
        attendees: validAttendees,
        timezone: "Asia/Colombo", // Default to Sri Lankan time
      };

      await createEvent(meetingDetails);

      // Save recent emails
      if (validAttendees.length > 0) {
        const updatedEmails = [
          ...new Set([...validAttendees, ...recentEmails]),
        ].slice(0, 10);
        chrome.storage.sync.set({ recentEmails: updatedEmails });
      }

      onCreateMeeting(meetingDetails);
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

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
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
                  list={`recent-emails-${index}`}
                />
                <datalist id={`recent-emails-${index}`}>
                  {recentEmails.map((recentEmail) => (
                    <option key={recentEmail} value={recentEmail} />
                  ))}
                </datalist>
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
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMeeting}
            disabled={!title.trim() || isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Create Meeting
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
