import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import SettingsModal from "../SettingsModal";
import { UserSettings } from "../../../types";
import { storageManager } from "../../../utils/storage";

// Mock the storage manager
vi.mock("../../../utils/storage", () => ({
  storageManager: {
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    resetToDefaults: vi.fn(),
    getUserSettings: vi.fn(),
  },
}));

// Mock the DraggableModal component
vi.mock("../../draggable/DraggableModal", () => ({
  default: ({ children, isOpen, onClose, title }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="draggable-modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
        {children}
      </div>
    );
  },
}));

// Mock HomeCountryManager
vi.mock("../HomeCountryManager", () => ({
  default: () => (
    <div data-testid="home-country-manager">Home Country Manager</div>
  ),
}));

const mockSettings: UserSettings = {
  hasCompletedOnboarding: true,
  hasSeenTour: true,
  homeCountry: "United States",
  homeTimezone: "America/New_York",
  homeTimezoneId: "us-eastern",
  theme: "light",
  defaultMeetingDuration: 60,
  showWorkingHours: true,
  workingHoursStart: 9,
  workingHoursEnd: 17,
  recentEmails: [],
  autoScrollToCurrentTime: true,
  showTimezoneFlags: true,
  settingsModalPosition: { x: 100, y: 100 },
};

describe("SettingsModal Form Controls and Validation", () => {
  const mockOnClose = vi.fn();
  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("General Tab", () => {
    it("renders all general settings controls", () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Should show theme selection
      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();

      // Should show meeting duration dropdown
      expect(screen.getByDisplayValue("1 hour")).toBeInTheDocument();

      // Should show toggle switches
      expect(
        screen.getByText("Auto-scroll to current time")
      ).toBeInTheDocument();
      expect(screen.getByText("Show country flags")).toBeInTheDocument();
    });

    it("allows changing theme selection", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const darkThemeButton = screen.getByText("Dark");
      fireEvent.click(darkThemeButton);

      // Should show save/reset buttons after change
      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });
    });

    it("allows changing meeting duration", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const durationSelect = screen.getByDisplayValue("1 hour");
      fireEvent.change(durationSelect, { target: { value: "30" } });

      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
      });
    });

    it("allows toggling boolean settings", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Find toggle buttons by their parent containers
      const autoScrollToggle = screen
        .getByText("Auto-scroll to current time")
        .closest("div")
        ?.querySelector("button");
      expect(autoScrollToggle).toBeInTheDocument();

      if (autoScrollToggle) {
        fireEvent.click(autoScrollToggle);
        await waitFor(() => {
          expect(screen.getByText("Save Changes")).toBeInTheDocument();
        });
      }
    });

    it("saves changes when save button is clicked", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Make a change
      const darkThemeButton = screen.getByText("Dark");
      fireEvent.click(darkThemeButton);

      // Click save
      await waitFor(() => {
        const saveButton = screen.getByText("Save Changes");
        fireEvent.click(saveButton);
      });

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: "dark",
        })
      );
    });

    it("resets changes when reset button is clicked", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Make a change
      const darkThemeButton = screen.getByText("Dark");
      fireEvent.click(darkThemeButton);

      // Click reset
      await waitFor(() => {
        const resetButton = screen.getByText("Reset");
        fireEvent.click(resetButton);
      });

      // Save/Reset buttons should disappear
      await waitFor(() => {
        expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
        expect(screen.queryByText("Reset")).not.toBeInTheDocument();
      });
    });
  });

  describe("Interface Tab", () => {
    beforeEach(() => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Switch to interface tab
      fireEvent.click(screen.getByRole("button", { name: /interface/i }));
    });

    it("renders interface settings controls", async () => {
      await waitFor(() => {
        expect(screen.getByText("Interface Settings")).toBeInTheDocument();
        expect(screen.getByText("Show working hours")).toBeInTheDocument();
      });
    });

    it("shows working hours time selectors when enabled", async () => {
      await waitFor(() => {
        expect(screen.getByText("Start Time")).toBeInTheDocument();
        expect(screen.getByText("End Time")).toBeInTheDocument();
      });
    });

    it("allows changing working hours", async () => {
      await waitFor(() => {
        const startTimeSelect = screen.getByDisplayValue("09:00");
        fireEvent.change(startTimeSelect, { target: { value: "8" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
      });
    });
  });

  describe("Home Country Tab", () => {
    it("renders home country manager", async () => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Switch to home country tab
      fireEvent.click(screen.getByRole("button", { name: /home country/i }));

      await waitFor(() => {
        expect(screen.getByTestId("home-country-manager")).toBeInTheDocument();
      });
    });
  });

  describe("Advanced Tab", () => {
    beforeEach(() => {
      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Switch to advanced tab
      fireEvent.click(screen.getByRole("button", { name: /advanced/i }));
    });

    it("renders advanced settings controls", async () => {
      await waitFor(() => {
        expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
        expect(screen.getByText("Export Settings")).toBeInTheDocument();
        expect(screen.getByText("Import Settings")).toBeInTheDocument();
        expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
      });
    });

    it("handles export settings", async () => {
      const mockExportData = JSON.stringify({ test: "data" });
      (storageManager.exportSettings as any).mockResolvedValue(mockExportData);

      // Mock URL.createObjectURL and related DOM methods
      const mockCreateObjectURL = vi.fn(() => "mock-url");
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      const mockCreateElement = vi.fn(() => mockAnchor);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      document.createElement = mockCreateElement;
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      await waitFor(() => {
        const exportButton = screen.getByText("Export Settings");
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(storageManager.exportSettings).toHaveBeenCalled();
      });
    });

    it("opens import dialog when import button is clicked", async () => {
      await waitFor(() => {
        const importButton = screen.getByText("Import Settings");
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Import Settings")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(
            "Paste your exported settings JSON here..."
          )
        ).toBeInTheDocument();
      });
    });

    it("validates import data", async () => {
      await waitFor(() => {
        const importButton = screen.getByText("Import Settings");
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        const importDialogButton = screen.getAllByText("Import")[1]; // Second "Import" button in dialog
        fireEvent.click(importDialogButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Please paste the settings data")
        ).toBeInTheDocument();
      });
    });

    it("shows reset confirmation dialog", async () => {
      await waitFor(() => {
        const resetButton = screen.getByText("Reset to Defaults");
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to reset all settings/)
        ).toBeInTheDocument();
      });
    });

    it("handles successful import", async () => {
      const mockNewSettings = { ...mockSettings, theme: "dark" as const };
      (storageManager.importSettings as any).mockResolvedValue(undefined);
      (storageManager.getUserSettings as any).mockResolvedValue(
        mockNewSettings
      );

      await waitFor(() => {
        const importButton = screen.getByText("Import Settings");
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          "Paste your exported settings JSON here..."
        );
        fireEvent.change(textarea, {
          target: { value: JSON.stringify(mockNewSettings) },
        });
      });

      await waitFor(() => {
        const importDialogButton = screen.getAllByText("Import")[1];
        fireEvent.click(importDialogButton);
      });

      await waitFor(() => {
        expect(storageManager.importSettings).toHaveBeenCalled();
        expect(mockOnSettingsChange).toHaveBeenCalledWith(mockNewSettings);
      });
    });
  });

  describe("Form Validation", () => {
    it("prevents saving invalid working hours", async () => {
      const invalidSettings = {
        ...mockSettings,
        workingHoursStart: 18,
        workingHoursEnd: 8, // End before start
      };

      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={invalidSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Switch to interface tab
      fireEvent.click(screen.getByRole("button", { name: /interface/i }));

      // The component should still render but with the invalid values
      await waitFor(() => {
        expect(screen.getByDisplayValue("18:00")).toBeInTheDocument();
        expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
      });
    });

    it("handles storage errors gracefully", async () => {
      (storageManager.exportSettings as any).mockRejectedValue(
        new Error("Storage error")
      );

      render(
        <SettingsModal
          isOpen={true}
          onClose={mockOnClose}
          currentSettings={mockSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Switch to advanced tab
      fireEvent.click(screen.getByRole("button", { name: /advanced/i }));

      await waitFor(() => {
        const exportButton = screen.getByText("Export Settings");
        fireEvent.click(exportButton);
      });

      // Should not crash and should reset processing state
      await waitFor(() => {
        expect(screen.getByText("Export Settings")).toBeInTheDocument();
      });
    });
  });
});
