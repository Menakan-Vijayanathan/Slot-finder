import { renderHook, act, waitFor } from "@testing-library/react";
import { useHomeCountry } from "../useHomeCountry";
import { storageManager } from "../../utils/storage";
import { createHomeTimezone, getUniqueCountries } from "../../utils/timezone";
import { UserSettings } from "../../types";

// Mock dependencies
vi.mock("../../utils/storage");
vi.mock("../../utils/timezone");

const mockStorageManager = vi.mocked(storageManager);
const mockCreateHomeTimezone = vi.mocked(createHomeTimezone);
const mockGetUniqueCountries = vi.mocked(getUniqueCountries);

// Mock isValidTimezone function
const mockIsValidTimezone = vi.fn();
vi.mock("../../utils/timezone", async () => {
  const actual = await vi.importActual("../../utils/timezone");
  return {
    ...actual,
    isValidTimezone: mockIsValidTimezone,
  };
});

describe("useHomeCountry", () => {
  const mockUserSettings: UserSettings = {
    hasCompletedOnboarding: true,
    hasSeenTour: false,
    homeCountry: "Sri Lanka",
    homeTimezone: "Asia/Colombo",
    homeTimezoneId: "home_123456789",
    theme: "system",
    defaultMeetingDuration: 60,
    showWorkingHours: true,
    workingHoursStart: 9,
    workingHoursEnd: 17,
    recentEmails: [],
    autoScrollToCurrentTime: true,
    showTimezoneFlags: true,
  };

  const mockHomeTimezone = {
    id: "home_123456789",
    name: "Colombo",
    iana: "Asia/Colombo",
    label: "Sri Lanka",
    country: "Sri Lanka",
    isHome: true,
    flag: "🇱🇰",
  };

  const mockCountries = [
    {
      name: "Sri Lanka",
      code: "sri_lanka",
      timezone: "Asia/Colombo",
      flag: "🇱🇰",
    },
    {
      name: "United States",
      code: "united_states",
      timezone: "America/New_York",
      flag: "🇺🇸",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageManager.getUserSettings.mockResolvedValue(mockUserSettings);
    mockCreateHomeTimezone.mockReturnValue(mockHomeTimezone);
    mockGetUniqueCountries.mockReturnValue(mockCountries);
    mockIsValidTimezone.mockReturnValue(true); // Default to valid timezone
  });

  describe("initialization", () => {
    it("should load home country data on mount", async () => {
      const { result } = renderHook(() => useHomeCountry());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.homeCountry).toBe("Sri Lanka");
      expect(result.current.homeTimezone).toBe("Asia/Colombo");
      expect(result.current.homeTimezoneId).toBe("home_123456789");
      expect(result.current.hasHomeCountry).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("should handle loading errors gracefully", async () => {
      const error = new Error("Storage error");
      mockStorageManager.getUserSettings.mockRejectedValue(error);

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to load home country data");
      expect(result.current.hasHomeCountry).toBe(false);
    });
  });

  describe("validateHomeCountryChange", () => {
    it("should validate valid country change", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validation =
        result.current.validateHomeCountryChange("United States");

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
      expect(validation.previewTimezone).toBeDefined();
    });

    it("should reject empty country name", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validation = result.current.validateHomeCountryChange("");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Country name is required");
    });

    it("should reject unknown country", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validation =
        result.current.validateHomeCountryChange("Unknown Country");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe(
        "Country not found in available timezone data"
      );
    });

    it("should reject country with invalid timezone", async () => {
      mockIsValidTimezone.mockReturnValue(false);

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validation = result.current.validateHomeCountryChange("Sri Lanka");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Invalid timezone for selected country");
    });
  });

  describe("changeHomeCountry", () => {
    it("should successfully change home country", async () => {
      const newHomeTimezone = {
        id: "home_987654321",
        name: "New York",
        iana: "America/New_York",
        label: "US Eastern",
        country: "United States",
        isHome: true,
        flag: "🇺🇸",
      };

      mockCreateHomeTimezone.mockReturnValue(newHomeTimezone);
      mockStorageManager.saveUserSettings.mockResolvedValue();

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let changeResult: any;
      await act(async () => {
        changeResult = await result.current.changeHomeCountry("United States");
      });

      expect(changeResult.success).toBe(true);
      expect(changeResult.homeTimezone).toBeDefined();
      expect(changeResult.homeTimezone.country).toBe("United States");

      expect(mockStorageManager.saveUserSettings).toHaveBeenCalledWith({
        homeCountry: "United States",
        homeTimezone: "America/New_York",
        homeTimezoneId: expect.stringMatching(/^home_\d+$/),
      });

      await waitFor(() => {
        expect(result.current.homeCountry).toBe("United States");
        expect(result.current.homeTimezone).toBe("America/New_York");
      });
    });

    it("should handle validation errors", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let changeResult: any;
      await act(async () => {
        changeResult = await result.current.changeHomeCountry("");
      });

      expect(changeResult.success).toBe(false);
      expect(changeResult.error).toBe("Country name is required");
    });

    it("should handle storage errors", async () => {
      const error = new Error("Storage save failed");
      mockStorageManager.saveUserSettings.mockRejectedValue(error);

      // Make sure validation passes
      const newHomeTimezone = {
        id: "home_987654321",
        name: "New York",
        iana: "America/New_York",
        label: "US Eastern",
        country: "United States",
        isHome: true,
        flag: "🇺🇸",
      };
      mockCreateHomeTimezone.mockReturnValue(newHomeTimezone);

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let changeResult: any;
      await act(async () => {
        changeResult = await result.current.changeHomeCountry("United States");
      });

      expect(changeResult.success).toBe(false);
      expect(changeResult.error).toBe("Storage save failed");
    });
  });

  describe("getHomeTimezone", () => {
    it("should return home timezone object", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const homeTimezone = result.current.getHomeTimezone();

      expect(homeTimezone).toEqual(mockHomeTimezone);
      expect(mockCreateHomeTimezone).toHaveBeenCalledWith("Sri Lanka");
    });

    it("should return null when no home country is set", async () => {
      mockStorageManager.getUserSettings.mockResolvedValue({
        ...mockUserSettings,
        homeCountry: "",
        homeTimezone: "",
      });

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const homeTimezone = result.current.getHomeTimezone();

      expect(homeTimezone).toBe(null);
    });
  });

  describe("addHomeTimezoneToList", () => {
    it("should add home timezone to the beginning of the list", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const existingTimezones = [
        {
          id: "tz1",
          name: "New York",
          iana: "America/New_York",
          label: "US Eastern",
          country: "United States",
          isHome: false,
        },
        {
          id: "tz2",
          name: "London",
          iana: "Europe/London",
          label: "United Kingdom",
          country: "United Kingdom",
          isHome: false,
        },
      ];

      const result_list =
        result.current.addHomeTimezoneToList(existingTimezones);

      expect(result_list).toHaveLength(3);
      expect(result_list[0]).toEqual(mockHomeTimezone);
      expect(result_list[0].isHome).toBe(true);
      expect(result_list[1]).toEqual(existingTimezones[0]);
      expect(result_list[2]).toEqual(existingTimezones[1]);
    });

    it("should filter out existing home timezones from the list", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const existingTimezones = [
        {
          id: "home_123456789",
          name: "Colombo",
          iana: "Asia/Colombo",
          label: "Sri Lanka",
          country: "Sri Lanka",
          isHome: true,
        },
        {
          id: "tz1",
          name: "New York",
          iana: "America/New_York",
          label: "US Eastern",
          country: "United States",
          isHome: false,
        },
      ];

      const result_list =
        result.current.addHomeTimezoneToList(existingTimezones);

      expect(result_list).toHaveLength(2);
      expect(result_list[0]).toEqual(mockHomeTimezone);
      expect(result_list[1].id).toBe("tz1");
    });

    it("should return original list when no home timezone is available", async () => {
      mockStorageManager.getUserSettings.mockResolvedValue({
        ...mockUserSettings,
        homeCountry: "",
        homeTimezone: "",
      });

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const existingTimezones = [
        {
          id: "tz1",
          name: "New York",
          iana: "America/New_York",
          label: "US Eastern",
          country: "United States",
          isHome: false,
        },
      ];

      const result_list =
        result.current.addHomeTimezoneToList(existingTimezones);

      expect(result_list).toEqual(existingTimezones);
    });
  });

  describe("isHomeTimezone", () => {
    it("should correctly identify home timezone", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isHomeTimezone("home_123456789")).toBe(true);
      expect(result.current.isHomeTimezone("other_timezone")).toBe(false);
    });
  });

  describe("refreshHomeCountryData", () => {
    it("should refresh data from storage", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change the mock to return different data
      const updatedSettings = {
        ...mockUserSettings,
        homeCountry: "United States",
        homeTimezone: "America/New_York",
        homeTimezoneId: "home_987654321",
      };
      mockStorageManager.getUserSettings.mockResolvedValue(updatedSettings);

      await act(async () => {
        await result.current.refreshHomeCountryData();
      });

      expect(result.current.homeCountry).toBe("United States");
      expect(result.current.homeTimezone).toBe("America/New_York");
      expect(result.current.homeTimezoneId).toBe("home_987654321");
    });

    it("should handle refresh errors", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error("Refresh failed");
      mockStorageManager.getUserSettings.mockRejectedValue(error);

      await act(async () => {
        await result.current.refreshHomeCountryData();
      });

      expect(result.current.error).toBe("Failed to refresh home country data");
    });
  });

  describe("getAvailableCountries", () => {
    it("should return available countries", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const countries = result.current.getAvailableCountries();

      expect(countries).toEqual(mockCountries);
      expect(mockGetUniqueCountries).toHaveBeenCalled();
    });
  });

  describe("hasHomeCountry", () => {
    it("should return true when home country is configured", async () => {
      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasHomeCountry).toBe(true);
    });

    it("should return false when home country is not configured", async () => {
      mockStorageManager.getUserSettings.mockResolvedValue({
        ...mockUserSettings,
        homeCountry: "",
        homeTimezone: "",
      });

      const { result } = renderHook(() => useHomeCountry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasHomeCountry).toBe(false);
    });
  });
});
