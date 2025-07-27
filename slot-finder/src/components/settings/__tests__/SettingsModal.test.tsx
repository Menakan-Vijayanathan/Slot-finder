import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import SettingsModal from "../SettingsModal";
import { UserSettings } from "../../../types";

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
};

describe("SettingsModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.queryByTestId("draggable-modal")).not.toBeInTheDocument();
  });

  it("renders modal with correct title when open", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByTestId("draggable-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Settings");
  });

  it("renders all navigation tabs", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(
      screen.getByRole("button", { name: /general/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /home country/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /interface/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /advanced/i })
    ).toBeInTheDocument();
  });

  it("shows general tab as active by default", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const generalTab = screen.getByRole("button", { name: /general/i });
    expect(generalTab).toHaveAttribute("aria-current", "page");
  });

  it("switches tabs when clicked", async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const homeCountryTab = screen.getByRole("button", {
      name: /home country/i,
    });
    fireEvent.click(homeCountryTab);

    await waitFor(() => {
      expect(homeCountryTab).toHaveAttribute("aria-current", "page");
    });

    expect(screen.getByText("Home Country")).toBeInTheDocument();
  });

  it("displays correct content for each tab", async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Test General tab (default)
    expect(screen.getByText("General Settings")).toBeInTheDocument();

    // Test Home Country tab
    fireEvent.click(screen.getByRole("button", { name: /home country/i }));
    await waitFor(() => {
      expect(screen.getByText("Home Country")).toBeInTheDocument();
    });

    // Test Interface tab
    fireEvent.click(screen.getByRole("button", { name: /interface/i }));
    await waitFor(() => {
      expect(screen.getByText("Interface")).toBeInTheDocument();
    });

    // Test Advanced tab
    fireEvent.click(screen.getByRole("button", { name: /advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Advanced")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    fireEvent.click(screen.getByTestId("close-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("has proper responsive layout structure", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Check for sidebar navigation
    const sidebar = screen.getByRole("navigation");
    expect(sidebar).toBeInTheDocument();

    // Check for main content area
    const mainContent = sidebar.nextElementSibling;
    expect(mainContent).toHaveClass("flex-1", "overflow-y-auto");
  });

  it("maintains tab state during modal lifecycle", async () => {
    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Switch to interface tab
    fireEvent.click(screen.getByRole("button", { name: /interface/i }));
    await waitFor(() => {
      expect(screen.getByText("Interface")).toBeInTheDocument();
    });

    // Close and reopen modal
    rerender(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Should reset to general tab
    expect(screen.getByText("General Settings")).toBeInTheDocument();
    const generalTab = screen.getByRole("button", { name: /general/i });
    expect(generalTab).toHaveAttribute("aria-current", "page");
  });
});
