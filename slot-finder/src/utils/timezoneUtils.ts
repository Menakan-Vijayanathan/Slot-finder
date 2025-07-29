import { DateTime } from 'luxon';
import { TimeZone, TimePeriod, Meeting, TimeSlotData } from '../types';

/**
 * Generate 24-hour time slots for a given date
 */
export const generateTimeSlots = (baseDate: DateTime): DateTime[] => {
  const slots: DateTime[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(baseDate.startOf('day').plus({ hours: hour }));
  }
  return slots;
};

/**
 * Convert time to specific timezone
 */
export const getTimeInTimezone = (dateTime: DateTime, timezone: TimeZone): DateTime => {
  // Add null/undefined check to prevent TypeError
  if (!dateTime || !dateTime.setZone) {
    console.error('Invalid dateTime object passed to getTimeInTimezone:', dateTime);
    return DateTime.now();
  }
  if (!timezone || !timezone.iana) {
    console.error('Invalid timezone object passed to getTimeInTimezone:', timezone);
    return dateTime;
  }
  return dateTime.setZone(timezone.iana);
};

/**
 * Get UTC offset for a timezone at a specific date
 */
export const getTimezoneOffset = (dateTime: DateTime, timezone: TimeZone): number => {
  const timeInZone = getTimeInTimezone(dateTime, timezone);
  return timeInZone.offset;
};

/**
 * Check if a time is within working hours
 */
export const isWorkingHours = (
  hour: number,
  startHour: number = 9,
  endHour: number = 17
): boolean => {
  return hour >= startHour && hour < endHour;
};

/**
 * Get time period for a given hour
 */
export const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Get period icon/emoji
 */
export const getPeriodIcon = (period: TimePeriod): string => {
  switch (period) {
    case 'morning': return '🌅';
    case 'afternoon': return '☀️';
    case 'evening': return '🌆';
    case 'night': return '🌙';
    default: return '🕐';
  }
};

/**
 * Get period color
 */
export const getPeriodColor = (period: TimePeriod): string => {
  switch (period) {
    case 'morning': return 'from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20';
    case 'afternoon': return 'from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20';
    case 'evening': return 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20';
    case 'night': return 'from-indigo-100 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20';
    default: return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700';
  }
};

/**
 * Get current time position as percentage (0-100%)
 */
export const getCurrentTimePosition = (currentTime: Date): number => {
  const now = DateTime.fromJSDate(currentTime);
  const minutesFromStart = now.hour * 60 + now.minute;
  const totalMinutesInDay = 24 * 60;
  return (minutesFromStart / totalMinutesInDay) * 100;
};

/**
 * Generate time comparison grid data
 */
export interface TimeGridData {
  timezone: TimeZone;
  slots: {
    originalTime: DateTime;
    localTime: DateTime;
    isWorkingHour: boolean;
    isDifferentDay: boolean;
  }[];
}

export const generateTimeGrid = (
  timezones: TimeZone[],
  baseDate: DateTime,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): TimeGridData[] => {
  const baseSlots = generateTimeSlots(baseDate);
  
  return timezones.map(timezone => ({
    timezone,
    slots: baseSlots.map(slot => {
      const localTime = getTimeInTimezone(slot, timezone);
      return {
        originalTime: slot,
        localTime,
        isWorkingHour: isWorkingHours(localTime.hour, workingHoursStart, workingHoursEnd),
        isDifferentDay: !localTime.hasSame(slot, 'day'),
      };
    })
  }));
};

/**
 * Find optimal meeting time across timezones
 */
export const findOptimalMeetingTimes = (
  timezones: TimeZone[],
  baseDate: DateTime,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): DateTime[] => {
  const gridData = generateTimeGrid(timezones, baseDate, workingHoursStart, workingHoursEnd);
  const optimalTimes: DateTime[] = [];
  
  // Check each hour to see if it's working hours for all timezones
  for (let hour = 0; hour < 24; hour++) {
    const isOptimalForAll = gridData.every(({ slots }) => {
      const slot = slots[hour];
      return slot.isWorkingHour;
    });
    
    if (isOptimalForAll) {
      optimalTimes.push(baseDate.startOf('day').plus({ hours: hour }));
    }
  }
  
  return optimalTimes;
};

/**
 * Format time for display in grid
 */
export const formatTimeForGrid = (dateTime: DateTime): string => {
  if (!dateTime || !dateTime.toFormat) {
    console.error('Invalid dateTime object passed to formatTimeForGrid:', dateTime);
    return '00:00';
  }
  return dateTime.toFormat('HH:mm');
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateTime: DateTime): string => {
  if (!dateTime || !dateTime.toFormat) {
    console.error('Invalid dateTime object passed to formatDateForDisplay:', dateTime);
    return 'Invalid Date';
  }
  return dateTime.toFormat('ccc, LLL dd');
};

/**
 * Check if a time slot is currently selected
 */
export const isTimeSlotSelected = (
  slot: DateTime,
  selectedTime: Date | null
): boolean => {
  if (!selectedTime) return false;
  const selectedSlot = DateTime.fromJSDate(selectedTime);
  return slot.hasSame(selectedSlot, 'hour') && slot.hasSame(selectedSlot, 'day');
};

/**
 * Generate enhanced time grid with periods and meetings
 */
export const generateEnhancedTimeGrid = (
  timezones: TimeZone[],
  baseDate: DateTime,
  meetings: Meeting[] = [],
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): TimeSlotData[] => {
  const baseSlots = generateTimeSlots(baseDate);
  const result: TimeSlotData[] = [];
  
  timezones.forEach(timezone => {
    baseSlots.forEach(slot => {
      const localTime = getTimeInTimezone(slot, timezone);
      const period = getTimePeriod(localTime.hour);
      const slotMeetings = meetings.filter(meeting => {
        const meetingStart = DateTime.fromJSDate(meeting.startTime);
        const meetingEnd = DateTime.fromJSDate(meeting.endTime);
        return (
          meeting.timezone === timezone.iana &&
          slot >= meetingStart &&
          slot < meetingEnd
        );
      });
      
      result.push({
        time: slot.toJSDate(),
        originalTime: slot, // Keep DateTime object for slot selection
        localTime: localTime.toJSDate(),
        timezone,
        period,
        isWorkingHour: isWorkingHours(localTime.hour, workingHoursStart, workingHoursEnd),
        meetings: slotMeetings,
        isDifferentDay: !localTime.hasSame(slot, 'day'),
      });
    });
  });
  
  return result;
};

/**
 * Get time zone display data with enhanced information
 */
export const getTimezoneDisplayData = (timezone: TimeZone, currentDate: DateTime) => {
  const currentTimeInZone = getTimeInTimezone(currentDate, timezone);
  const offset = getTimezoneOffset(currentDate, timezone);
  const period = getTimePeriod(currentTimeInZone.hour);
  
  return {
    ...timezone,
    currentTime: currentTimeInZone,
    offset,
    offsetDisplay: currentTimeInZone.toFormat('ZZ'),
    localDate: formatDateForDisplay(currentTimeInZone),
    period,
    periodIcon: getPeriodIcon(period),
  };
};
