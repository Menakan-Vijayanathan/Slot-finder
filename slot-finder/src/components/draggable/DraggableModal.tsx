import React, { useEffect, forwardRef } from "react";
import { X, GripVertical } from "lucide-react";
import { useDraggable } from "../../hooks/useDraggable";
import { DraggableModalProps } from "../../types";
import { cn } from "../../utils";
import { getCenterPosition } from "../../utils/position";

const DraggableModal = forwardRef<HTMLDivElement, DraggableModalProps>(
  (
    { children, isOpen, onClose, title, defaultPosition, onPositionChange },
    ref
  ) => {
    const {
      elementRef,
      dragHandleRef,
      position,
      isDragging,
      style,
      setPosition,
    } = useDraggable(`modal-${title.toLowerCase().replace(/\s+/g, "-")}`, {
      constrainToParent: false,
      handle: ".modal-drag-handle",
      onDragStart: (pos) => {
        console.log(`Started dragging modal ${title} at:`, pos);
      },
      onDrag: onPositionChange,
      onDragEnd: (pos) => {
        console.log(`Finished dragging modal ${title} at:`, pos);
        onPositionChange?.(pos);
      },
    });

    // Center modal on first open if no saved position
    useEffect(() => {
      if (isOpen && position.x === 0 && position.y === 0) {
        const centerModal = () => {
          const element = elementRef.current;
          if (element) {
            const rect = element.getBoundingClientRect();
            const centerPos = getCenterPosition(
              rect.width,
              rect.height,
              window.innerWidth,
              window.innerHeight
            );

            // Use default position if provided, otherwise center
            const finalPosition = defaultPosition || centerPos;
            setPosition(finalPosition);
          }
        };

        // Small delay to ensure element is rendered
        setTimeout(centerModal, 50);
      }
    }, [isOpen, position, defaultPosition, setPosition]);

    // Handle escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !isDragging) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, isDragging, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200",
            isDragging && "cursor-grabbing"
          )}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal
            if (e.target === e.currentTarget && !isDragging) {
              onClose();
            }
          }}
        />

        {/* Modal */}
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
          style={{
            ...style,
            zIndex: 50, // Higher than backdrop
          }}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700",
            "max-w-3xl w-full max-h-[90vh] overflow-hidden",
            "transition-all duration-200",
            isDragging && "shadow-3xl scale-[1.02] rotate-1"
          )}
        >
          {/* Modal Header with Drag Handle */}
          <div
            ref={dragHandleRef}
            className={cn(
              "modal-drag-handle flex items-center justify-between px-4 py-3",
              "border-b border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-750 rounded-t-lg",
              "cursor-grab active:cursor-grabbing select-none",
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="relative overflow-y-auto max-h-[calc(90vh-60px)]">
            {children}
          </div>

          {/* Dragging Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg pointer-events-none" />
          )}
        </div>
      </>
    );
  }
);

DraggableModal.displayName = "DraggableModal";

export default DraggableModal;
