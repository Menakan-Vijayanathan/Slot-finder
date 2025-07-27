import { useState, useRef, useCallback, useEffect } from "react";
import { Position, DragState, DraggableOptions } from "../types";
import {
  constrainToViewport,
  constrainToParent,
  getEventPosition,
} from "../utils/position";
import { storageManager } from "../utils/storage";

export function useDraggable(
  elementId: string,
  options: DraggableOptions = {}
) {
  const {
    constrainToParent: shouldConstrainToParent = false,
    disabled = false,
    handle,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });

  const elementRef = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLElement>(null);
  const parentRef = useRef<HTMLElement>(null);

  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      const savedPosition = await storageManager.getPanelPosition(elementId);
      if (savedPosition) {
        setPosition(savedPosition);
      }
    };
    loadPosition();
  }, [elementId]);

  // Save position when it changes
  const savePosition = useCallback(
    async (newPosition: Position) => {
      await storageManager.savePanelPosition(elementId, newPosition);
    },
    [elementId]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (disabled) return;

      const element = elementRef.current;
      if (!element) return;

      // Check if we're clicking on the handle (if specified)
      if (handle && dragHandleRef.current) {
        const handleElement = dragHandleRef.current;
        const target = event.target as HTMLElement;
        if (!handleElement.contains(target)) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();

      const eventPosition = getEventPosition(event);
      const elementRect = element.getBoundingClientRect();

      const offset = {
        x: eventPosition.x - elementRect.left,
        y: eventPosition.y - elementRect.top,
      };

      const newDragState: DragState = {
        isDragging: true,
        startPosition: eventPosition,
        currentPosition: eventPosition,
        offset,
      };

      setDragState(newDragState);
      onDragStart?.(eventPosition);

      // Add global event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      // Change cursor for the entire document
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [disabled, handle, onDragStart]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging) return;

      const eventPosition = getEventPosition(event);
      updatePosition(eventPosition);
    },
    [dragState.isDragging]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!dragState.isDragging) return;

      event.preventDefault(); // Prevent scrolling
      const eventPosition = getEventPosition(event);
      updatePosition(eventPosition);
    },
    [dragState.isDragging]
  );

  const updatePosition = useCallback(
    (eventPosition: Position) => {
      const element = elementRef.current;
      if (!element) return;

      const newPosition = {
        x: eventPosition.x - dragState.offset.x,
        y: eventPosition.y - dragState.offset.y,
      };

      // Apply constraints
      let constrainedPosition = newPosition;
      const elementRect = element.getBoundingClientRect();

      if (shouldConstrainToParent && parentRef.current) {
        const parentRect = parentRef.current.getBoundingClientRect();
        constrainedPosition = constrainToParent(
          newPosition,
          elementRect.width,
          elementRect.height,
          parentRect.width,
          parentRect.height
        );
      } else {
        constrainedPosition = constrainToViewport(
          newPosition,
          elementRect.width,
          elementRect.height
        );
      }

      setPosition(constrainedPosition);
      setDragState((prev) => ({
        ...prev,
        currentPosition: eventPosition,
      }));

      onDrag?.(constrainedPosition);
    },
    [dragState.offset, shouldConstrainToParent, onDrag]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;

    // Remove global event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);

    // Reset cursor and user selection
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    setDragState((prev) => ({
      ...prev,
      isDragging: false,
    }));

    // Save the final position
    savePosition(position);
    onDragEnd?.(position);
  }, [
    dragState.isDragging,
    position,
    savePosition,
    onDragEnd,
    handleMouseMove,
    handleTouchMove,
  ]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Set up event listeners on the element
  useEffect(() => {
    const element = handle ? dragHandleRef.current : elementRef.current;
    if (!element || disabled) return;

    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("touchstart", handleMouseDown, { passive: false });

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("touchstart", handleMouseDown);
    };
  }, [handleMouseDown, disabled, handle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Reset position function
  const resetPosition = useCallback(() => {
    const newPosition = { x: 0, y: 0 };
    setPosition(newPosition);
    savePosition(newPosition);
  }, [savePosition]);

  // Set position programmatically
  const setPositionProgrammatically = useCallback(
    (newPosition: Position) => {
      setPosition(newPosition);
      savePosition(newPosition);
    },
    [savePosition]
  );

  return {
    // Refs to attach to elements
    elementRef,
    dragHandleRef,
    parentRef,

    // Current state
    position,
    isDragging: dragState.isDragging,

    // Control functions
    resetPosition,
    setPosition: setPositionProgrammatically,

    // Style object for the draggable element
    style: {
      position: "fixed" as const,
      left: position.x,
      top: position.y,
      cursor: dragState.isDragging ? "grabbing" : handle ? "default" : "grab",
      zIndex: dragState.isDragging ? 1000 : "auto",
      transition: dragState.isDragging ? "none" : "all 0.2s ease-out",
    },
  };
}
