import { Position } from "../types";

/**
 * Constrains a position to stay within the viewport boundaries
 */
export const constrainToViewport = (
  position: Position,
  elementWidth: number,
  elementHeight: number
): Position => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    x: Math.max(0, Math.min(position.x, viewportWidth - elementWidth)),
    y: Math.max(0, Math.min(position.y, viewportHeight - elementHeight)),
  };
};

/**
 * Constrains a position to stay within a parent element
 */
export const constrainToParent = (
  position: Position,
  elementWidth: number,
  elementHeight: number,
  parentWidth: number,
  parentHeight: number
): Position => {
  return {
    x: Math.max(0, Math.min(position.x, parentWidth - elementWidth)),
    y: Math.max(0, Math.min(position.y, parentHeight - elementHeight)),
  };
};

/**
 * Calculates the distance between two positions
 */
export const getDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Gets the center position of an element
 */
export const getCenterPosition = (
  elementWidth: number,
  elementHeight: number,
  containerWidth: number,
  containerHeight: number
): Position => {
  return {
    x: (containerWidth - elementWidth) / 2,
    y: (containerHeight - elementHeight) / 2,
  };
};

/**
 * Converts mouse/touch event to position
 */
export const getEventPosition = (event: MouseEvent | TouchEvent): Position => {
  if ("touches" in event && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  } else if ("clientX" in event) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }
  return { x: 0, y: 0 };
};

/**
 * Checks if a position is within bounds
 */
export const isWithinBounds = (
  position: Position,
  bounds: { width: number; height: number }
): boolean => {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x <= bounds.width &&
    position.y <= bounds.height
  );
};
