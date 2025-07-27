import React, { forwardRef } from "react";
import { GripVertical } from "lucide-react";
import { useDraggable } from "../../hooks/useDraggable";
import { DraggablePanelProps } from "../../types";
import { cn } from "../../utils";

const DraggablePanel = forwardRef<HTMLDivElement, DraggablePanelProps>(
  (
    {
      children,
      title,
      defaultPosition,
      onPositionChange,
      constrainToParent = false,
      className,
    },
    ref
  ) => {
    const {
      elementRef,
      dragHandleRef,
      parentRef,
      position,
      isDragging,
      style,
    } = useDraggable(`panel-${title.toLowerCase().replace(/\s+/g, "-")}`, {
      constrainToParent,
      handle: ".drag-handle",
      onDragStart: (pos) => {
        console.log(`Started dragging ${title} at:`, pos);
      },
      onDrag: onPositionChange,
      onDragEnd: (pos) => {
        console.log(`Finished dragging ${title} at:`, pos);
        onPositionChange?.(pos);
      },
    });

    // Set default position if provided
    React.useEffect(() => {
      if (defaultPosition && position.x === 0 && position.y === 0) {
        // Only set default if we haven't loaded a saved position
        setTimeout(() => {
          if (position.x === 0 && position.y === 0) {
            // Still at origin, safe to set default
            const element = elementRef.current;
            if (element) {
              element.style.left = `${defaultPosition.x}px`;
              element.style.top = `${defaultPosition.y}px`;
            }
          }
        }, 100);
      }
    }, [defaultPosition, position]);

    return (
      <div
        ref={constrainToParent ? parentRef : undefined}
        className={cn("relative", constrainToParent && "overflow-hidden")}
      >
        <div
          ref={(node) => {
            elementRef.current = node;
            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          style={style}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            "transition-shadow duration-200",
            isDragging && "shadow-2xl scale-[1.02]",
            className
          )}
        >
          {/* Drag Handle Header */}
          <div
            ref={dragHandleRef}
            className={cn(
              "drag-handle flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-750 rounded-t-lg cursor-grab active:cursor-grabbing",
              "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              isDragging && "cursor-grabbing bg-gray-100 dark:bg-gray-700"
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical
                className={cn(
                  "w-4 h-4 text-gray-400 dark:text-gray-500",
                  isDragging && "text-gray-600 dark:text-gray-300"
                )}
              />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white select-none">
                {title}
              </h3>
            </div>

            {/* Optional: Add minimize/close buttons here */}
            <div className="flex items-center gap-1">
              {/* Drag indicator dots */}
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Panel Content */}
          <div className="relative">{children}</div>

          {/* Dragging Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg pointer-events-none" />
          )}
        </div>
      </div>
    );
  }
);

DraggablePanel.displayName = "DraggablePanel";

export default DraggablePanel;
