import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import DraggablePanel from "../draggable/DraggablePanel";
import TimeZoneManager from "../TimeZoneManager";
import { TimeZone } from "../../types";
import { storageManager } from "../../utils/storage";

// Mock the storage manager
vi.mock("../../utils/storage", () => ({
  storageManager: {
    savePanelPosition: vi.fn(),
    getPanelPosition: vi.fn(),
  },
}));

// Mock the useHomeCountry hook
vi.mock("../../hooks/useHomeCountry", () => ({
  useHomeCountry: () => ({
    isHomeTimezone: vi.fn(() => false),
    addHomeTimezoneToList: vi.fn((timezones) => timezones),
    homeCountry: "United States",
  }),
}));

// Mock react-beautiful-dnd
vi.mock("react-beautiful-dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-drop-context">{children}</div>
  ),
  Droppable: ({
    children,
  }: {
    children: (provided: any, snapshot: any) => React.ReactNode;
  }) =>
    children(
      {
        droppableProps: {},
        innerRef: vi.fn(),
        placeholder: null,
      },
      {
        isDraggingOver: false,
        draggingOverWith: null,
        draggingFromThisWith: null,
        isUsingPlaceholder: false,
      }
    ),
  Draggable: ({
    children,
  }: {
    children: (provided: any, snapshot: any) => React.ReactNode;
  }) =>
    children(
      {
        draggableProps: {},
        dragHandleProps: {},
        innerRef: vi.fn(),
      },
      {
        isDragging: false,
        isDropAnimating: false,
        dropAnimation: null,
        draggingOver: null,
        combineWith: null,
        combineTargetFor: null,
        mode: null,
      }
    ),
}));

describe("DraggableTimeZoneManager Integration", () => {
  const mockTimezones: TimeZone[] = [
    {
      id: "1",
      name: "New York",
      iana: "America/New_York",
      label: "Eastern Time",
      country: "United States",
    },
    {
      id: "2",
      name: "London",
      iana: "Europe/London",
      label: "Greenwich Mean Time",
      country: "United Kingdom",
    },
  ];

  const mockProps = {
    timezones: mockTimezones,
    onAddTimezone: vi.fn(),
    onRemoveTimezone: vi.fn(),
    onReorderTimezones: vi.fn(),
  };

  const mockOnPositionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders TimeZoneManager wrapped in DraggablePanel", () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
    expect(screen.getByText("Add Timezone")).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("displays drag handle in the panel header", () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const dragHandle = document.querySelector(".drag-handle");
    expect(dragHandle).toBeInTheDocument();
    expect(screen.getByText("Timezone Manager")).toBeInTheDocument();
  });

  it("maintains timezone drag-and-drop functionality within the draggable panel", () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    // Verify that the DragDropContext is rendered (timezone drag-and-drop)
    expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();

    // Verify timezone items are still draggable within the panel
    const timezoneItems = screen.getAllByRole("button", {
      name: /remove timezone/i,
    });
    expect(timezoneItems).toHaveLength(2);
  });

  it("calls onPositionChange when panel is dragged", async () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const dragHandle = document.querySelector(".drag-handle");
    expect(dragHandle).toBeInTheDocument();

    // Simulate drag start
    fireEvent.mouseDown(dragHandle!, { clientX: 100, clientY: 100 });

    // Simulate drag move
    fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });

    // Simulate drag end
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(mockOnPositionChange).toHaveBeenCalled();
    });
  });

  it("persists position changes to storage", async () => {
    const mockSavePanelPosition = vi.mocked(storageManager.savePanelPosition);

    const TestComponent = () => {
      const handlePositionChange = (position: { x: number; y: number }) => {
        storageManager.savePanelPosition("timezone-manager", position);
      };

      return (
        <DraggablePanel
          title="Timezone Manager"
          onPositionChange={handlePositionChange}
        >
          <TimeZoneManager {...mockProps} />
        </DraggablePanel>
      );
    };

    render(<TestComponent />);

    const dragHandle = document.querySelector(".drag-handle");

    // Simulate drag
    fireEvent.mouseDown(dragHandle!, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(mockSavePanelPosition).toHaveBeenCalledWith(
        "timezone-manager",
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });
  });

  it("does not interfere with timezone add functionality", async () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const addButton = screen.getByText("Add Timezone");
    fireEvent.click(addButton);

    // Verify the search input appears
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search cities or countries...")
      ).toBeInTheDocument();
    });

    // Verify onAddTimezone is not affected by draggable wrapper
    expect(mockProps.onAddTimezone).not.toHaveBeenCalled(); // Should only be called when actually adding
  });

  it("does not interfere with timezone remove functionality", () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const removeButtons = screen.getAllByRole("button", {
      name: /remove timezone/i,
    });
    fireEvent.click(removeButtons[0]);

    expect(mockProps.onRemoveTimezone).toHaveBeenCalledWith("1");
  });

  it("does not interfere with timezone reordering functionality", () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    // Verify that timezone drag handles are still present and functional
    const gripIcons = document.querySelectorAll(
      '[data-testid="grip-vertical"]'
    );
    expect(gripIcons.length).toBeGreaterThan(0);
  });

  it("applies correct styling when dragging the panel", async () => {
    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const panel = document.querySelector('[style*="position: absolute"]');
    const dragHandle = document.querySelector(".drag-handle");

    // Start dragging
    fireEvent.mouseDown(dragHandle!, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(dragHandle).toHaveClass("cursor-grabbing");
    });

    // End dragging
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(dragHandle).not.toHaveClass("cursor-grabbing");
    });
  });

  it("constrains panel movement within viewport boundaries", async () => {
    // Mock viewport dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });

    render(
      <DraggablePanel
        title="Timezone Manager"
        onPositionChange={mockOnPositionChange}
        constrainToParent={true}
      >
        <TimeZoneManager {...mockProps} />
      </DraggablePanel>
    );

    const dragHandle = document.querySelector(".drag-handle");

    // Try to drag beyond viewport boundaries
    fireEvent.mouseDown(dragHandle!, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 2000, clientY: 2000 }); // Way beyond viewport
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(mockOnPositionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });

    // Position should be constrained within reasonable bounds
    const lastCall =
      mockOnPositionChange.mock.calls[
        mockOnPositionChange.mock.calls.length - 1
      ];
    if (lastCall) {
      const [position] = lastCall;
      expect(position.x).toBeLessThan(1024);
      expect(position.y).toBeLessThan(768);
    }
  });

  it("loads saved position on mount", async () => {
    const mockGetPanelPosition = vi.mocked(storageManager.getPanelPosition);
    mockGetPanelPosition.mockResolvedValue({ x: 100, y: 200 });

    const TestComponent = () => {
      const [position, setPosition] = React.useState({ x: 0, y: 0 });

      React.useEffect(() => {
        const loadPosition = async () => {
          const savedPosition =
            await storageManager.getPanelPosition("timezone-manager");
          if (savedPosition) {
            setPosition(savedPosition);
          }
        };
        loadPosition();
      }, []);

      return (
        <DraggablePanel
          title="Timezone Manager"
          defaultPosition={position}
          onPositionChange={mockOnPositionChange}
        >
          <TimeZoneManager {...mockProps} />
        </DraggablePanel>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(mockGetPanelPosition).toHaveBeenCalledWith("timezone-manager");
    });
  });
});
