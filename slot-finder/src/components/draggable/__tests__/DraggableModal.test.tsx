import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DraggableModal from "../DraggableModal";

// Mock the useDraggable hook
jest.mock("../../../hooks/useDraggable", () => ({
  useDraggable: jest.fn(() => ({
    elementRef: { current: null },
    dragHandleRef: { current: null },
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
    setPosition: jest.fn(),
  })),
}));

// Mock position utilities
jest.mock("../../../utils/position", () => ({
  getCenterPosition: jest.fn(() => ({ x: 100, y: 100 })),
}));

describe("DraggableModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: "Test Modal",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <DraggableModal {...defaultProps}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <DraggableModal {...defaultProps} isOpen={false}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <DraggableModal {...defaultProps} onClose={onClose}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    const closeButton = screen.getByLabelText("Close modal");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when escape key is pressed", () => {
    const onClose = jest.fn();
    render(
      <DraggableModal {...defaultProps} onClose={onClose}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows backdrop", () => {
    const { container } = render(
      <DraggableModal {...defaultProps}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    const backdrop = container.querySelector(".bg-black\\/50");
    expect(backdrop).toBeInTheDocument();
  });

  it("shows drag handle with grip icon", () => {
    render(
      <DraggableModal {...defaultProps}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    const dragHandle = screen
      .getByText("Test Modal")
      .closest(".modal-drag-handle");
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveClass("cursor-grab");
  });

  it("handles backdrop click to close", () => {
    const onClose = jest.fn();
    const { container } = render(
      <DraggableModal {...defaultProps} onClose={onClose}>
        <div>Modal Content</div>
      </DraggableModal>
    );

    const backdrop = container.querySelector(".bg-black\\/50");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
