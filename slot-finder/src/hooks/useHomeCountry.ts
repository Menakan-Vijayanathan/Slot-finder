import { useState, useCallback, useEffect } from "react";
import { TimeZone, UserSettings, CountryData } from "../types";
import { storageManager } from "../utils/storage";
import {
  getUniqueCountries,
  createHomeTimezone,
  isValidTimezone,
} from "../utils/timezone";

export interface HomeCountryState {
  homeCountry: string;
  homeTimezone: string;
  homeTimezoneId: string;
  isLoading: boolean;
  error: string | null;
}

export interface HomeCountryOperations {
  changeHomeCountry: (
    countryName: string,
    options?: { skipConfirmation?: boolean }
  ) => Promise<{ success: boolean; homeTimezone?: TimeZone; error?: string }>;
  validateHomeCountryChange: (countryName: string) => {
    isValid: boolean;
    error?: string;
    previewTimezone?: TimeZone;
  };
  getHomeTimezone: () => TimeZone | null;
  addHomeTimezoneToList: (timezones: TimeZone[]) => TimeZone[];
  isHomeTimezone: (timezoneId: string) => boolean;
  refreshHomeCountryData: () => Promise<void>;
}

export function useHomeCountry() {
  const [homeCountryState, setHomeCountryState] = useState<HomeCountryState>({
    homeCountry: "",
    homeTimezone: "",
    homeTimezoneId: "",
    isLoading: true,
    error: null,
  });

  // Load home country data on mount
  useEffect(() => {
    const loadHomeCountryData = async () => {
      try {
        setHomeCountryState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const settings = await storageManager.getUserSettings();

        setHomeCountryState({
          homeCountry: settings.homeCountry,
          homeTimezone: settings.homeTimezone,
          homeTimezoneId: settings.homeTimezoneId,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading home country data:", error);
        setHomeCountryState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load home country data",
        }));
      }
    };

    loadHomeCountryData();
  }, []);

  // Validate home country change
  const validateHomeCountryChange = useCallback((countryName: string) => {
    if (!countryName || !countryName.trim()) {
      return {
        isValid: false,
        error: "Country name is required",
      };
    }

    // Check if country exists in our data
    const countries = getUniqueCountries();
    const country = countries.find((c) => c.name === countryName);

    if (!country) {
      return {
        isValid: false,
        error: "Country not found in available timezone data",
      };
    }

    // Validate timezone
    if (!isValidTimezone(country.timezone)) {
      return {
        isValid: false,
        error: "Invalid timezone for selected country",
      };
    }

    // Create preview timezone
    const previewTimezone = createHomeTimezone(countryName);
    if (!previewTimezone) {
      return {
        isValid: false,
        error: "Unable to create timezone for selected country",
      };
    }

    return {
      isValid: true,
      previewTimezone,
    };
  }, []);

  // Change home country
  const changeHomeCountry = useCallback(
    async (
      countryName: string,
      options: { skipConfirmation?: boolean } = {}
    ) => {
      try {
        // Validate the change
        const validation = validateHomeCountryChange(countryName);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error,
          };
        }

        setHomeCountryState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        // Create new home timezone
        const newHomeTimezone = createHomeTimezone(countryName);
        if (!newHomeTimezone) {
          throw new Error("Failed to create home timezone");
        }

        // Generate new home timezone ID
        const newHomeTimezoneId = `home_${Date.now()}`;
        newHomeTimezone.id = newHomeTimezoneId;

        // Update settings
        const settingsUpdate: Partial<UserSettings> = {
          homeCountry: countryName,
          homeTimezone: newHomeTimezone.iana,
          homeTimezoneId: newHomeTimezoneId,
        };

        await storageManager.saveUserSettings(settingsUpdate);

        // Update local state
        setHomeCountryState({
          homeCountry: countryName,
          homeTimezone: newHomeTimezone.iana,
          homeTimezoneId: newHomeTimezoneId,
          isLoading: false,
          error: null,
        });

        return {
          success: true,
          homeTimezone: newHomeTimezone,
        };
      } catch (error) {
        console.error("Error changing home country:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to change home country";

        setHomeCountryState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [validateHomeCountryChange]
  );

  // Get current home timezone object
  const getHomeTimezone = useCallback((): TimeZone | null => {
    if (!homeCountryState.homeCountry || !homeCountryState.homeTimezone) {
      return null;
    }

    const tz = createHomeTimezone(homeCountryState.homeCountry);
    if (!tz) return null;
    return {
      ...tz,
      isHome: true,
      flag: tz.flag || COUNTRY_FLAGS[tz.country] || "🌍",
    };
  }, [homeCountryState.homeCountry, homeCountryState.homeTimezone]);

  // Add home timezone to timezone list (ensuring it's at the top)
  const addHomeTimezoneToList = useCallback(
    (timezones: TimeZone[]): TimeZone[] => {
      const homeTimezone = getHomeTimezone();
      if (!homeTimezone) {
        return timezones;
      }

      // Remove any existing home timezone from the list
      const filteredTimezones = timezones.filter(
        (tz) => !tz.isHome && tz.id !== homeCountryState.homeTimezoneId
      );

      // Add home timezone at the beginning
      return [
        {
          ...homeTimezone,
          isHome: true,
          flag:
            homeTimezone.flag || COUNTRY_FLAGS[homeTimezone.country] || "🌍",
        },
        ...filteredTimezones,
      ];
    },
    [getHomeTimezone, homeCountryState.homeTimezoneId]
  );

  // Check if a timezone is the home timezone
  const isHomeTimezone = useCallback(
    (timezoneId: string): boolean => {
      return timezoneId === homeCountryState.homeTimezoneId;
    },
    [homeCountryState.homeTimezoneId]
  );

  // Refresh home country data from storage
  const refreshHomeCountryData = useCallback(async () => {
    try {
      setHomeCountryState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const settings = await storageManager.getUserSettings();

      setHomeCountryState({
        homeCountry: settings.homeCountry,
        homeTimezone: settings.homeTimezone,
        homeTimezoneId: settings.homeTimezoneId,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error refreshing home country data:", error);
      setHomeCountryState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to refresh home country data",
      }));
    }
  }, []);

  // Get available countries for selection
  const getAvailableCountries = useCallback((): CountryData[] => {
    return getUniqueCountries();
  }, []);

  // Check if home country is configured
  const hasHomeCountry = Boolean(
    homeCountryState.homeCountry && homeCountryState.homeTimezone
  );

  const operations: HomeCountryOperations = {
    changeHomeCountry,
    validateHomeCountryChange,
    getHomeTimezone,
    addHomeTimezoneToList,
    isHomeTimezone,
    refreshHomeCountryData,
  };

  return {
    // State
    ...homeCountryState,
    hasHomeCountry,

    // Operations
    ...operations,

    // Helpers
    getAvailableCountries,
  };
}
