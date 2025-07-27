import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CountrySelector from "../CountrySelector";

// Mock the timezone utilities
jest.mock("../../../utils/timezone", () => ({
  getUniqueCountries: jest.fn(() => [
    {
      name: "United States",
      code: "us",
      timezone: "America/New_York",
      flag: "🇺🇸",
    },
    {
      name: "United Kingdom",
      code: "gb",
      timezone: "Europe/London",
      flag: "🇬🇧",
    },
    { name: "Canada", code: "ca", timezone: "America/Toronto", flag: "🇨🇦" },
    { name: "Australia", code: "au", timezone: "Australia/Sydney", flag: "🇦🇺" },
  ]),
  getTimezoneForCountry: jest.fn((countryName) => ({
    id: "test-id",
    name: "Test City",
    iana: "Test/Timezone",
    label: "Test Label",
    country: countryName,
    isHome: true,
    flag: "🌍",
  })),
}));

describe("CountrySelector", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with placeholder", () => {
    render(<CountrySelector {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("Select your country...")
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<CountrySelector {...defaultProps} placeholder="Choose country" />);

    expect(screen.getByPlaceholderText("Choose country")).toBeInTheDocument();
  });

  it("opens dropdown when input is focused", async () => {
    render(<CountrySelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("Popular Countries")).toBeInTheDocument();
    });
  });

  it("filters countries based on search term", async () => {
    render(<CountrySelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "United" } });

    await waitFor(() => {
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      expect(screen.queryByText("Canada")).not.toBeInTheDocument();
    });
  });

  it("calls onChange when country is selected", async () => {
    const onChange = jest.fn();
    render(<CountrySelector {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("United States")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("United States"));

    expect(onChange).toHaveBeenCalledWith("United States", "Test/Timezone");
  });

  it("handles keyboard navigation", async () => {
    render(<CountrySelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.keyDown(input, { key: "ArrowDown" });

    await waitFor(() => {
      expect(screen.getByText("Popular Countries")).toBeInTheDocument();
    });

    // Test arrow down navigation
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onChange).toHaveBeenCalled();
  });

  it("closes dropdown on escape key", async () => {
    render(<CountrySelector {...defaultProps} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("Popular Countries")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Popular Countries")).not.toBeInTheDocument();
    });
  });

  it("shows flags when showFlags is true", async () => {
    render(<CountrySelector {...defaultProps} showFlags={true} />);

    const input = screen.getByPlaceholderText("Select your country...");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    });
  });

  it("displays selected country value", () => {
    render(<CountrySelector {...defaultProps} value="United States" />);

    const input = screen.getByDisplayValue("United States");
    expect(input).toBeInTheDocument();
  });
});
