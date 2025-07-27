import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import OnboardingTour from "../OnboardingTour";

// Mock DOM methods
const mockScrollIntoView = vi.fn();
const mockQuerySelector = vi.fn();

// Create mock element
const createMockElement = (rect: DOMRect) => ({
  getBoundingClientRect: () => rect,
  scrollIntoView: mockScrollIntoView,
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
});

describe("OnboardingTour - Basic Functionality", () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  const defaultProps = {
    isActive: true,
    onComplete: mockOnComplete,
    onSkip: mockOnSkip,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Mock document.querySelector
    document.querySelector = mockQuerySelector;

    // Default mock element position (center of screen)
    const defaultRect: DOMRect = {
      top: 300,
      left: 400,
      right: 600,
      bottom: 400,
      width: 200,
      height: 100,
      x: 400,
      y: 300,
      toJSON: () => ({}),
    };

    mockQuerySelector.mockReturnValue(createMockElement(defaultRect));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Component Visibility", () => {
    it("should not render when isActive is false", () => {
      render(<OnboardingTour {...defaultProps} isActive={false} />);

      expect(screen.queryByText("Timezone Manager")).not.toBeInTheDocument();
    });

    it("should render when isActive is true and target element exists", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should not render if target element is not found", () => {
      mockQuerySelector.mockReturnValue(null);

      render(<OnboardingTour {...defaultProps} />);

      expect(screen.queryByText("Timezone Manager")).not.toBeInTheDocument();
    });
  });

  describe("Tour Steps Content", () => {
    it("should display first step content correctly", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
          expect(screen.getByText("Step 1 of 6")).toBeInTheDocument();
          expect(
            screen.getByText(/This is where you can add, remove, and reorder/)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should show correct progress percentage", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText("17%")).toBeInTheDocument(); // 1/6 * 100 = 16.67% rounded to 17%
        },
        { timeout: 1000 }
      );
    });

    it("should disable previous button on first step", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          const previousButton = screen.getByText("Previous");
          expect(previousButton).toBeDisabled();
        },
        { timeout: 1000 }
      );
    });

    it("should enable next button on first step", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          const nextButton = screen.getByText("Next");
          expect(nextButton).not.toBeDisabled();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Element Highlighting", () => {
    it("should add highlight class to target element", async () => {
      const mockElement = createMockElement({
        top: 300,
        left: 400,
        right: 600,
        bottom: 400,
        width: 200,
        height: 100,
        x: 400,
        y: 300,
        toJSON: () => ({}),
      });

      mockQuerySelector.mockReturnValue(mockElement);

      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockElement.classList.add).toHaveBeenCalledWith(
            "tour-highlight"
          );
        },
        { timeout: 1000 }
      );
    });

    it("should remove highlight class when component unmounts", async () => {
      const mockElement = createMockElement({
        top: 300,
        left: 400,
        right: 600,
        bottom: 400,
        width: 200,
        height: 100,
        x: 400,
        y: 300,
        toJSON: () => ({}),
      });

      mockQuerySelector.mockReturnValue(mockElement);

      const { unmount } = render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockElement.classList.add).toHaveBeenCalledWith(
            "tour-highlight"
          );
        },
        { timeout: 1000 }
      );

      unmount();

      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        "tour-highlight"
      );
    });

    it("should scroll target element into view", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockScrollIntoView).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle missing target elements gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockQuerySelector.mockReturnValue(null);

      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Tour target not found: [data-tour='timezone-manager']"
          );
        },
        { timeout: 1000 }
      );

      consoleSpy.mockRestore();
    });

    it("should not crash when getBoundingClientRect throws", async () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockImplementation(() => {
          throw new Error("getBoundingClientRect failed");
        }),
        scrollIntoView: mockScrollIntoView,
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      };

      mockQuerySelector.mockReturnValue(mockElement);

      // Should not throw an error
      expect(() => {
        render(<OnboardingTour {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should skip tour when Escape key is pressed", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalledTimes(1);
      });
    });

    it("should advance to next step when right arrow key is pressed", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      fireEvent.keyDown(document, { key: "ArrowRight" });

      await waitFor(
        () => {
          expect(screen.getByText("Add Timezones")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByLabelText("Skip tour")).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should have semantic button elements", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          const nextButton = screen.getByText("Next");
          const previousButton = screen.getByText("Previous");
          const skipButton = screen.getByLabelText("Skip tour");

          expect(nextButton.tagName).toBe("BUTTON");
          expect(previousButton.tagName).toBe("BUTTON");
          expect(skipButton.tagName).toBe("BUTTON");
        },
        { timeout: 1000 }
      );
    });

    it("should have proper button states", async () => {
      render(<OnboardingTour {...defaultProps} />);

      await waitFor(
        () => {
          const previousButton = screen.getByText("Previous");
          const nextButton = screen.getByText("Next");

          expect(previousButton).toBeDisabled();
          expect(nextButton).not.toBeDisabled();
        },
        { timeout: 1000 }
      );
    });
  });
});
