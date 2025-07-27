import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DraggablePanel from "../DraggablePanel";

// Mock the useDraggable hook
jest.mock("../../../hooks/useDraggable", () => ({
  useDraggable: jest.fn(() => ({
    elementRef: { current: null },
    dragHandleRef: { current: null },
    parentRef: { current: null },
    position: { x: 0, y: 0 },
    isDragging: false,
    style: {
      position: "fixed",
      left: 0,
      top: 0,
      cursor: "grab",
      zIndex: "auto",
      transition: "all 0.2s ease-out",
    },
  })),
}));

describe("DraggablePanel", () => {
  it("renders with title and children", () => {
    render(
      <DraggablePanel title="Test Panel">
        <div>Panel Content</div>
      </DraggablePanel>
    );

    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DraggablePanel title="Test Panel" className="custom-class">
        <div>Content</div>
      </DraggablePanel>
    );

    const panel = container.querySelector(".custom-class");
    expect(panel).toBeInTheDocument();
  });

  it("shows drag handle with grip icon", () => {
    render(
      <DraggablePanel title="Test Panel">
        <div>Content</div>
      </DraggablePanel>
    );

    const dragHandle = screen.getByText("Test Panel").closest(".drag-handle");
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveClass("cursor-grab");
  });

  it("renders drag indicator dots", () => {
    const { container } = render(
      <DraggablePanel title="Test Panel">
        <div>Content</div>
      </DraggablePanel>
    );

    const dots = container.querySelectorAll(".w-1.h-1.bg-gray-400");
    expect(dots).toHaveLength(3);
  });

  it("handles constrainToParent prop", () => {
    const { container } = render(
      <DraggablePanel title="Test Panel" constrainToParent>
        <div>Content</div>
      </DraggablePanel>
    );

    const parentContainer = container.firstChild as HTMLElement;
    expect(parentContainer).toHaveClass("overflow-hidden");
  });
});
