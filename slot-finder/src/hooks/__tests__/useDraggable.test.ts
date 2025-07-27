import { renderHook, act } from "@testing-library/react";
import { useDraggable } from "../useDraggable";

// Mock the storage manager
jest.mock("../../utils/storage", () => ({
  storageManager: {
    getPanelPosition: jest.fn().mockResolvedValue(null),
    savePanelPosition: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("useDraggable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default position", () => {
    const { result } = renderHook(() => useDraggable("test-element"));

    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it("should provide correct style object", () => {
    const { result } = renderHook(() => useDraggable("test-element"));

    expect(result.current.style).toEqual({
      position: "fixed",
      left: 0,
      top: 0,
      cursor: "grab",
      zIndex: "auto",
      transition: "all 0.2s ease-out",
    });
  });

  it("should update position programmatically", async () => {
    const { result } = renderHook(() => useDraggable("test-element"));

    await act(async () => {
      result.current.setPosition({ x: 100, y: 200 });
    });

    expect(result.current.position).toEqual({ x: 100, y: 200 });
  });

  it("should reset position to origin", async () => {
    const { result } = renderHook(() => useDraggable("test-element"));

    // First set a position
    await act(async () => {
      result.current.setPosition({ x: 100, y: 200 });
    });

    // Then reset
    await act(async () => {
      result.current.resetPosition();
    });

    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it("should handle disabled state", () => {
    const { result } = renderHook(() =>
      useDraggable("test-element", { disabled: true })
    );

    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it("should call callbacks when provided", () => {
    const onDragStart = jest.fn();
    const onDrag = jest.fn();
    const onDragEnd = jest.fn();

    renderHook(() =>
      useDraggable("test-element", {
        onDragStart,
        onDrag,
        onDragEnd,
      })
    );

    // Note: Full drag simulation would require more complex DOM setup
    // This test just ensures the hook accepts the callbacks without error
    expect(onDragStart).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });
});
