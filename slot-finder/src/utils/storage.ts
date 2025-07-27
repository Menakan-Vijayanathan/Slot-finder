import { UserSettings, Position, OnboardingData } from "../types";

// Default user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  hasCompletedOnboarding: false,
  hasSeenTour: false,
  homeCountry: "",
  homeTimezone: "",
  homeTimezoneId: "",
  theme: "system",
  defaultMeetingDuration: 60,
  showWorkingHours: true,
  workingHoursStart: 9,
  workingHoursEnd: 17,
  recentEmails: [],
  autoScrollToCurrentTime: true,
  showTimezoneFlags: true,
};

/**
 * Storage utility class for managing user preferences and settings
 */
export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Get user settings from storage
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      const stored = localStorage.getItem("userSettings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_USER_SETTINGS, ...parsed };
      }
      return DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error("Error loading user settings:", error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  /**
   * Save user settings to storage
   */
  async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem("userSettings", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Error saving user settings:", error);
      throw error;
    }
  }

  /**
   * Get panel position from storage
   */
  async getPanelPosition(panelId: string): Promise<Position | null> {
    try {
      const stored = localStorage.getItem(`panelPosition_${panelId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Error loading position for panel ${panelId}:`, error);
      return null;
    }
  }

  /**
   * Save panel position to storage
   */
  async savePanelPosition(panelId: string, position: Position): Promise<void> {
    try {
      localStorage.setItem(
        `panelPosition_${panelId}`,
        JSON.stringify(position)
      );
    } catch (error) {
      console.error(`Error saving position for panel ${panelId}:`, error);
    }
  }

  /**
   * Get onboarding data from storage
   */
  async getOnboardingData(): Promise<Partial<OnboardingData> | null> {
    try {
      const stored = localStorage.getItem("onboardingData");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading onboarding data:", error);
      return null;
    }
  }

  /**
   * Save onboarding data to storage
   */
  async saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
    try {
      localStorage.setItem("onboardingData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      throw error;
    }
  }

  /**
   * Clear onboarding data from storage
   */
  async clearOnboardingData(): Promise<void> {
    try {
      localStorage.removeItem("onboardingData");
    } catch (error) {
      console.error("Error clearing onboarding data:", error);
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      localStorage.setItem(
        "userSettings",
        JSON.stringify(DEFAULT_USER_SETTINGS)
      );
      // Clear all panel positions
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("panelPosition_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error resetting to defaults:", error);
      throw error;
    }
  }

  /**
   * Export all settings as JSON
   */
  async exportSettings(): Promise<string> {
    try {
      const settings = await this.getUserSettings();
      const positions: Record<string, Position> = {};

      // Collect all panel positions
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("panelPosition_")) {
          const panelId = key.replace("panelPosition_", "");
          const position = localStorage.getItem(key);
          if (position) {
            positions[panelId] = JSON.parse(position);
          }
        }
      });

      return JSON.stringify(
        {
          settings,
          positions,
          exportDate: new Date().toISOString(),
        },
        null,
        2
      );
    } catch (error) {
      console.error("Error exporting settings:", error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.settings) {
        await this.saveUserSettings(data.settings);
      }

      if (data.positions) {
        Object.entries(data.positions).forEach(([panelId, position]) => {
          this.savePanelPosition(panelId, position as Position);
        });
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();
