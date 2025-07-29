import moment from 'moment-timezone';
import { TimeZone, TimePeriod, Meeting, TimeSlotData } from '../types';

/**
 * Enhanced timezone utilities using Moment.js
 * Strategic plan for perfect timezone management
 */

// =============================================================================
// PHASE 1: TIME PERIOD DETECTION WITH COUNTRY-SPECIFIC LOGIC
// =============================================================================

/**
 * Get enhanced time period with country-specific logic
 * Different countries have different concepts of day periods
 */
export const getTimePeriod = (hour: number, country?: string): TimePeriod => {
  // Country-specific time period logic
  switch (country?.toLowerCase()) {
    case 'spain':
    case 'italy':
      // Mediterranean schedule - lunch siesta culture
      if (hour >= 6 && hour < 14) return 'morning';
      if (hour >= 14 && hour < 17) return 'afternoon'; // siesta time
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    
    case 'japan':
    case 'south korea':
      // East Asian schedule
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      if (hour >= 18 && hour < 23) return 'evening';
      return 'night';
    
    case 'india':
      // Indian schedule
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 16) return 'afternoon';
      if (hour >= 16 && hour < 21) return 'evening';
      return 'night';
    
    default:
      // Standard Western schedule
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
  }
};

/**
 * Get period icon with cultural context
 */
export const getPeriodIcon = (period: TimePeriod, country?: string): string => {
  const countrySpecific = country?.toLowerCase();
  
  switch (period) {
    case 'morning':
      if (countrySpecific === 'japan') return '🌅'; // Sunrise
      if (countrySpecific === 'india') return '🕉️'; // Om symbol
      return '🌅';
    
    case 'afternoon':
      if (countrySpecific === 'spain' || countrySpecific === 'italy') return '🌴'; // Siesta
      if (countrySpecific === 'japan') return '🍱'; // Bento lunch
      return '☀️';
    
    case 'evening':
      if (countrySpecific === 'japan') return '🏮'; // Lantern
      if (countrySpecific === 'india') return '🪔'; // Diya lamp
      return '🌆';
    
    case 'night':
      return '🌙';
    
    default:
      return '🕐';
  }
};

/**
 * Get period color with enhanced styling
 */
export const getPeriodColor = (period: TimePeriod): string => {
  switch (period) {
    case 'morning': 
      return 'from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800';
    case 'afternoon': 
      return 'from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800';
    case 'evening': 
      return 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800';
    case 'night': 
      return 'from-indigo-100 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800';
    default: 
      return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600';
  }
};

// =============================================================================
// PHASE 2: UNIQUE TIMEZONE MANAGEMENT
// =============================================================================

/**
 * Ensure unique timezones - no duplicates allowed
 */
export const ensureUniqueTimezones = (timezones: TimeZone[]): TimeZone[] => {
  const seen = new Set<string>();
  return timezones.filter(tz => {
    if (seen.has(tz.iana)) {
      console.warn(`Duplicate timezone detected and removed: ${tz.iana}`);
      return false;
    }
    seen.add(tz.iana);
    return true;
  });
};

/**
 * Validate timezone exists in moment-timezone
 */
export const validateTimezone = (iana: string): boolean => {
  return moment.tz.zone(iana) !== null;
};

/**
 * Get current time in specific timezone using Moment.js
 */
export const getCurrentTimeInTimezone = (timezone: TimeZone): moment.Moment => {
  if (!validateTimezone(timezone.iana)) {
    console.error(`Invalid timezone: ${timezone.iana}`);
    return moment();
  }
  return moment.tz(timezone.iana);
};

/**
 * Convert any time to specific timezone
 */
export const convertTimeToTimezone = (time: moment.Moment | Date | string, timezone: TimeZone): moment.Moment => {
  if (!validateTimezone(timezone.iana)) {
    console.error(`Invalid timezone: ${timezone.iana}`);
    return moment(time);
  }
  
  return moment(time).tz(timezone.iana);
};

// =============================================================================
// PHASE 3: PERFECT TIME ALIGNMENT
// =============================================================================

/**
 * Generate perfectly aligned 24-hour time slots
 */
export const generateAlignedTimeSlots = (baseDate: moment.Moment | Date): moment.Moment[] => {
  const base = moment(baseDate).startOf('day');
  const slots: moment.Moment[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    slots.push(base.clone().add(hour, 'hours'));
  }
  
  return slots;
};

/**
 * Generate enhanced time grid with perfect alignment
 */
export const generateEnhancedTimeGrid = (
  timezones: TimeZone[],
  baseDate: moment.Moment | Date,
  meetings: Meeting[] = [],
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): TimeSlotData[] => {
  // Ensure unique timezones
  const uniqueTimezones = ensureUniqueTimezones(timezones);
  const baseSlots = generateAlignedTimeSlots(baseDate);
  const result: TimeSlotData[] = [];
  
  uniqueTimezones.forEach(timezone => {
    baseSlots.forEach((slot, hourIndex) => {
      const localTime = convertTimeToTimezone(slot, timezone);
      const period = getTimePeriod(localTime.hour(), timezone.country);
      
      // Filter meetings for this specific slot
      const slotMeetings = meetings.filter(meeting => {
        const meetingStart = moment(meeting.startTime).tz(timezone.iana);
        const meetingEnd = moment(meeting.endTime).tz(timezone.iana);
        return (
          meeting.timezone === timezone.iana &&
          localTime.isSameOrAfter(meetingStart) &&
          localTime.isBefore(meetingEnd)
        );
      });
      
      result.push({
        time: slot.toDate(),
        originalTime: slot, // Keep moment object for calculations
        localTime: localTime.toDate(),
        timezone,
        period,
        isWorkingHour: localTime.hour() >= workingHoursStart && localTime.hour() < workingHoursEnd,
        meetings: slotMeetings,
        isDifferentDay: !localTime.isSame(slot, 'day'),
      });
    });
  });
  
  return result;
};

// =============================================================================
// PHASE 4: HOME COUNTRY MANAGEMENT
// =============================================================================

/**
 * Set timezone as home country
 */
export const setAsHomeTimezone = (timezones: TimeZone[], timezoneId: string): TimeZone[] => {
  return timezones.map(tz => ({
    ...tz,
    isHome: tz.id === timezoneId
  }));
};

/**
 * Get home timezone from list
 */
export const getHomeTimezone = (timezones: TimeZone[]): TimeZone | null => {
  return timezones.find(tz => tz.isHome) || null;
};

/**
 * Get enhanced timezone display data
 */
export const getTimezoneDisplayData = (timezone: TimeZone, currentDate: moment.Moment | Date) => {
  const currentTimeInZone = convertTimeToTimezone(currentDate, timezone);
  const period = getTimePeriod(currentTimeInZone.hour(), timezone.country);
  
  return {
    ...timezone,
    currentTime: currentTimeInZone,
    offset: currentTimeInZone.format('Z'),
    offsetDisplay: currentTimeInZone.format('Z'),
    localDate: currentTimeInZone.format('ddd, MMM DD'),
    localTime: currentTimeInZone.format('HH:mm'),
    period,
    periodIcon: getPeriodIcon(period, timezone.country),
    periodColor: getPeriodColor(period),
    isToday: currentTimeInZone.isSame(moment(), 'day'),
    dayDifference: currentTimeInZone.diff(moment().startOf('day'), 'days'),
  };
};

// =============================================================================
// PHASE 5: UTILITY FUNCTIONS
// =============================================================================

/**
 * Format time for grid display
 */
export const formatTimeForGrid = (time: moment.Moment | Date): string => {
  return moment(time).format('HH:mm');
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date: moment.Moment | Date): string => {
  return moment(date).format('ddd, MMM DD');
};

/**
 * Check if time slot is selected
 */
export const isTimeSlotSelected = (
  slot: moment.Moment | Date,
  selectedTime: Date | null
): boolean => {
  if (!selectedTime) return false;
  const slotMoment = moment(slot);
  const selectedMoment = moment(selectedTime);
  return slotMoment.isSame(selectedMoment, 'hour') && slotMoment.isSame(selectedMoment, 'day');
};

/**
 * Get current time position as percentage (0-100%)
 */
export const getCurrentTimePosition = (currentTime: Date | moment.Moment): number => {
  const now = moment(currentTime);
  const minutesFromStart = now.hour() * 60 + now.minute();
  const totalMinutesInDay = 24 * 60;
  return (minutesFromStart / totalMinutesInDay) * 100;
};

/**
 * Find optimal meeting times across all timezones
 */
export const findOptimalMeetingTimes = (
  timezones: TimeZone[],
  baseDate: moment.Moment | Date,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): moment.Moment[] => {
  const uniqueTimezones = ensureUniqueTimezones(timezones);
  const baseSlots = generateAlignedTimeSlots(baseDate);
  const optimalTimes: moment.Moment[] = [];
  
  baseSlots.forEach(slot => {
    const isOptimalForAll = uniqueTimezones.every(timezone => {
      const localTime = convertTimeToTimezone(slot, timezone);
      const hour = localTime.hour();
      return hour >= workingHoursStart && hour < workingHoursEnd;
    });
    
    if (isOptimalForAll) {
      optimalTimes.push(slot);
    }
  });
  
  return optimalTimes;
};

// =============================================================================
// TIMEZONE DATA & VALIDATION
// =============================================================================

/**
 * Get available timezones with enhanced data
 */
export const getAvailableTimezones = (): string[] => {
  return moment.tz.names();
};

/**
 * Search timezones by country or city
 */
export const searchTimezones = (query: string): string[] => {
  const allZones = getAvailableTimezones();
  const lowerQuery = query.toLowerCase();
  
  return allZones.filter(zone => 
    zone.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit results
};

/**
 * Get timezone info
 */
export const getTimezoneInfo = (iana: string) => {
  const zone = moment.tz.zone(iana);
  if (!zone) return null;
  
  const now = moment.tz(iana);
  return {
    name: iana,
    offset: now.format('Z'),
    offsetMinutes: now.utcOffset(),
    isDST: now.isDST(),
    abbreviation: now.format('z'),
  };
};
