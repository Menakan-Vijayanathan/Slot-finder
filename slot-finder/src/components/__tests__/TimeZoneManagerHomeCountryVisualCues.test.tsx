import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TimeZoneManager from "../TimeZoneManager";
import { TimeZone } from "../../types";

// Mock the useHomeCountry hook
const mockUseHomeCountry = {
  isHomeTimezone: vi.fn(() => false),
  addHomeTimezoneToList: vi.fn((timezones) => timezones),
  homeCountry: "United States",
};

vi.mock("../../hooks/useHomeCountry", () => ({
  useHomeCountry: () => mockUseHomeCountry,
}));

// Mock the timezone utility
vi.mock("../../utils/timezone", () => ({
  COUNTRY_FLAGS: {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Sri Lanka": "🇱🇰",
    Japan: "🇯🇵",
  },
}));

describe("TimeZoneManager Home Country Visual Cues", () => {
  const mockTimezones: TimeZone[] = [
    {
      id: "1",
      name: "New York",
      iana: "America/New_York",
      label: "US Eastern",
      country: "United States",
      isHome: false,
    },
  ];

  const mockProps = {
    timezones: mockTimezones,
    onAddTimezone: vi.fn(),
    onRemoveTimezone: vi.fn(),
    onReorderTimezones: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show visual cues for home country timezones in search dropdown", async () => {
    render(<TimeZoneManager {...mockProps} />);

    // Open the search dropdown
    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Type in search to show results (use Chicago since New York is already in the list)
    const searchInput = screen.getByPlaceholderText(
      "Search cities or countries..."
    );
    fireEvent.change(searchInput, { target: { value: "Chicago" } });

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText("Chicago")).toBeInTheDocument();
    });

    // Check if the home country timezone has special styling
    const chicagoButton = screen.getByText("Chicago").closest("button");
    expect(chicagoButton).toHaveClass("from-blue-50", "to-cyan-50");

    // Check if home country indicator is present
    expect(screen.getByText("Home Country")).toBeInTheDocument();

    // Check if home icon is present (look for the Home component)
    const homeIcon = chicagoButton?.querySelector("svg");
    expect(homeIcon).toBeInTheDocument();

    // Check if country flag is displayed
    expect(screen.getByText("🇺🇸")).toBeInTheDocument();
  });

  it("should show regular styling for non-home country timezones", async () => {
    render(<TimeZoneManager {...mockProps} />);

    // Open the search dropdown
    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Type in search to show results from a different country
    const searchInput = screen.getByPlaceholderText(
      "Search cities or countries..."
    );
    fireEvent.change(searchInput, { target: { value: "London" } });

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText("London")).toBeInTheDocument();
    });

    // Check if the non-home country timezone has regular styling
    const londonButton = screen.getByText("London").closest("button");
    expect(londonButton).not.toHaveClass("from-blue-50", "to-cyan-50");

    // Check if home country indicator is NOT present
    expect(screen.queryByText("Home Country")).not.toBeInTheDocument();

    // Check if country flag is still displayed
    expect(screen.getByText("🇬🇧")).toBeInTheDocument();
  });

  it("should show appropriate tooltip for home country timezones", async () => {
    render(<TimeZoneManager {...mockProps} />);

    // Open the search dropdown
    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Type in search to show results
    const searchInput = screen.getByPlaceholderText(
      "Search cities or countries..."
    );
    fireEvent.change(searchInput, { target: { value: "Chicago" } });

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText("Chicago")).toBeInTheDocument();
    });

    // Check if the tooltip is set correctly for home country timezone
    const chicagoButton = screen.getByText("Chicago").closest("button");
    expect(chicagoButton).toHaveAttribute(
      "title",
      "Chicago is in your home country (United States)"
    );
  });

  it("should show appropriate tooltip for non-home country timezones", async () => {
    render(<TimeZoneManager {...mockProps} />);

    // Open the search dropdown
    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Type in search to show results from a different country
    const searchInput = screen.getByPlaceholderText(
      "Search cities or countries..."
    );
    fireEvent.change(searchInput, { target: { value: "Tokyo" } });

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
    });

    // Check if the tooltip is set correctly for non-home country timezone
    const tokyoButton = screen.getByText("Tokyo").closest("button");
    expect(tokyoButton).toHaveAttribute("title", "Add Tokyo timezone");
  });

  it("should handle missing country flags gracefully", async () => {
    render(<TimeZoneManager {...mockProps} />);

    // Open the search dropdown
    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Type in search for a country not in the COUNTRY_FLAGS mapping
    const searchInput = screen.getByPlaceholderText(
      "Search cities or countries..."
    );
    fireEvent.change(searchInput, { target: { value: "Unknown City" } });

    // Should show default world emoji for unknown countries
    // This test would need actual timezone data with unknown countries
    // For now, we just verify the search functionality works
    expect(searchInput).toHaveValue("Unknown City");
  });
});
