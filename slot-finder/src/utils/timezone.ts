import { TimeZone, CountryData } from "../types";
import { timezoneData } from "../data/timezones";

/**
 * Country flags mapping (using emoji flags)
 */
export const COUNTRY_FLAGS: Record<string, string> = {
  "Sri Lanka": "🇱🇰",
  "United Arab Emirates": "🇦🇪",
  Singapore: "🇸🇬",
  "Hong Kong": "🇭🇰",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  China: "🇨🇳",
  Thailand: "🇹🇭",
  Indonesia: "🇮🇩",
  Philippines: "🇵🇭",
  Malaysia: "🇲🇾",
  India: "🇮🇳",
  Pakistan: "🇵🇰",
  "United Kingdom": "🇬🇧",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  Netherlands: "🇳🇱",
  Spain: "🇪🇸",
  Sweden: "🇸🇪",
  Switzerland: "🇨🇭",
  Russia: "🇷🇺",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  "New Zealand": "🇳🇿",
  Egypt: "🇪🇬",
  "South Africa": "🇿🇦",
  Nigeria: "🇳🇬",
};

/**
 * Get unique countries from timezone data
 */
export const getUniqueCountries = (): CountryData[] => {
  const countryMap = new Map<string, CountryData>();

  timezoneData.forEach((tz) => {
    if (!countryMap.has(tz.country)) {
      countryMap.set(tz.country, {
        name: tz.country,
        code: tz.country.toLowerCase().replace(/\s+/g, "_"),
        timezone: tz.iana,
        flag: COUNTRY_FLAGS[tz.country] || "🌍",
      });
    }
  });

  return Array.from(countryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

/**
 * Get timezone data for a specific country
 */
export const getTimezoneForCountry = (countryName: string): TimeZone | null => {
  const timezone = timezoneData.find((tz) => tz.country === countryName);
  if (!timezone) return null;

  return {
    id: `home_${Date.now()}`,
    name: timezone.name,
    iana: timezone.iana,
    label: timezone.label,
    country: timezone.country,
    isHome: true,
    flag: COUNTRY_FLAGS[timezone.country] || "🌍",
  };
};

/**
 * Create a home timezone from country selection
 */
export const createHomeTimezone = (countryName: string): TimeZone | null => {
  return getTimezoneForCountry(countryName);
};

/**
 * Check if a timezone is in working hours (9 AM - 5 PM)
 */
export const isWorkingHours = (
  hour: number,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): boolean => {
  return hour >= workingHoursStart && hour < workingHoursEnd;
};

/**
 * Get working hours range for a timezone
 */
export const getWorkingHoursRange = (
  timezone: string,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): { start: number; end: number } => {
  // This is a simplified version - in a real implementation,
  // you'd want to use a proper timezone library to handle DST and other complexities
  return {
    start: workingHoursStart,
    end: workingHoursEnd,
  };
};

/**
 * Filter timezones by search term
 */
export const filterTimezones = (searchTerm: string) => {
  if (!searchTerm.trim()) return timezoneData;

  const term = searchTerm.toLowerCase();
  return timezoneData.filter(
    (tz) =>
      tz.name.toLowerCase().includes(term) ||
      tz.label.toLowerCase().includes(term) ||
      tz.country.toLowerCase().includes(term)
  );
};

/**
 * Sort timezones with home timezone first
 */
export const sortTimezonesWithHome = (timezones: TimeZone[]): TimeZone[] => {
  return [...timezones].sort((a, b) => {
    if (a.isHome && !b.isHome) return -1;
    if (!a.isHome && b.isHome) return 1;
    return 0;
  });
};

/**
 * Validate timezone IANA identifier
 */
export const isValidTimezone = (iana: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: iana });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get timezone offset in hours
 */
export const getTimezoneOffset = (iana: string): number => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetTime = new Date(
      utc.toLocaleString("en-US", { timeZone: iana })
    );
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
};
