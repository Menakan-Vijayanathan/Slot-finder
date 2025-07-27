import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  SkipForward,
  Target,
  CheckCircle,
} from "lucide-react";
import { OnboardingTourProps, TourStep } from "../../types";
import { cn } from "../../utils";

// Tour steps configuration
const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='timezone-manager']",
    title: "Timezone Manager",
    content:
      "This is where you can add, remove, and reorder your timezones. Your home timezone will always appear at the top with a special indicator.",
    placement: "bottom",
    showSkip: true,
    showPrevious: false,
  },
  {
    target: "[data-tour='add-timezone']",
    title: "Add Timezones",
    content:
      "Click here to add new timezones to your list. You can search for cities or countries to find the timezone you need.",
    placement: "bottom",
    showSkip: true,
    showPrevious: true,
  },
  {
    target: "[data-tour='timezone-card']",
    title: "Timezone Cards",
    content:
      "Each timezone shows the current time and location. You can drag and drop these cards to reorder them. Your home timezone cannot be removed.",
    placement: "right",
    showSkip: true,
    showPrevious: true,
  },
  {
    target: "[data-tour='time-slider']",
    title: "Time Slider",
    content:
      "This interactive timeline shows times across all your timezones. The red line indicates the current time, and green areas show your working hours.",
    placement: "top",
    showSkip: true,
    showPrevious: true,
  },
  {
    target: "[data-tour='time-slot']",
    title: "Schedule Meetings",
    content:
      "Click on any time slot to create a meeting. The system will show you the corresponding time in all your selected timezones.",
    placement: "top",
    showSkip: true,
    showPrevious: true,
  },
  {
    target: "[data-tour='settings-button']",
    title: "Settings",
    content:
      "Access your preferences here. You can change your home country, adjust working hours, and customize the interface to your liking.",
    placement: "left",
    showSkip: true,
    showPrevious: true,
  },
];

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right";
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isActive,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Get current step data
  const currentStepData = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calculate tooltip position based on target element
  const calculateTooltipPosition = useCallback(
    (element: HTMLElement, placement: string): TooltipPosition => {
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 320; // Approximate tooltip width
      const tooltipHeight = 200; // Approximate tooltip height
      const offset = 16; // Distance from target element

      let top = 0;
      let left = 0;
      let finalPlacement = placement as TooltipPosition["placement"];

      switch (placement) {
        case "top":
          top = rect.top - tooltipHeight - offset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          // Check if tooltip would go off-screen
          if (top < 0) {
            finalPlacement = "bottom";
            top = rect.bottom + offset;
          }
          break;

        case "bottom":
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          // Check if tooltip would go off-screen
          if (top + tooltipHeight > window.innerHeight) {
            finalPlacement = "top";
            top = rect.top - tooltipHeight - offset;
          }
          break;

        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - offset;
          // Check if tooltip would go off-screen
          if (left < 0) {
            finalPlacement = "right";
            left = rect.right + offset;
          }
          break;

        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + offset;
          // Check if tooltip would go off-screen
          if (left + tooltipWidth > window.innerWidth) {
            finalPlacement = "left";
            left = rect.left - tooltipWidth - offset;
          }
          break;
      }

      // Ensure tooltip stays within viewport bounds
      left = Math.max(
        16,
        Math.min(left, window.innerWidth - tooltipWidth - 16)
      );
      top = Math.max(
        16,
        Math.min(top, window.innerHeight - tooltipHeight - 16)
      );

      return { top, left, placement: finalPlacement };
    },
    []
  );

  // Find and highlight target element
  const highlightTarget = useCallback(
    (stepData: TourStep) => {
      const element = document.querySelector(stepData.target) as HTMLElement;

      if (!element) {
        console.warn(`Tour target not found: ${stepData.target}`);
        return false;
      }

      setTargetElement(element);

      // Calculate tooltip position
      const position = calculateTooltipPosition(
        element,
        stepData.placement || "bottom"
      );
      setTooltipPosition(position);

      // Scroll element into view if needed
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Add highlight class to target element
      element.classList.add("tour-highlight");

      // Show tooltip after a brief delay
      setTimeout(() => setIsVisible(true), 300);
      return true;
    },
    [calculateTooltipPosition]
  );

  // Remove highlight from current target
  const removeHighlight = useCallback(() => {
    if (targetElement) {
      targetElement.classList.remove("tour-highlight");
    }
    setIsVisible(false);
    setTargetElement(null);
    setTooltipPosition(null);
  }, [targetElement]);

  // Handle step navigation
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;

      removeHighlight();

      setTimeout(() => {
        setCurrentStep(stepIndex);
      }, 200);
    },
    [removeHighlight]
  );

  const nextStep = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      goToStep(currentStep + 1);
    }
  }, [currentStep, isLastStep, goToStep]);

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, isFirstStep, goToStep]);

  const handleComplete = useCallback(() => {
    removeHighlight();
    setTimeout(() => {
      onComplete();
    }, 200);
  }, [removeHighlight, onComplete]);

  const handleSkip = useCallback(() => {
    removeHighlight();
    setTimeout(() => {
      onSkip();
    }, 200);
  }, [removeHighlight, onSkip]);

  // Initialize tour when activated
  useEffect(() => {
    if (isActive && currentStepData) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        highlightTarget(currentStepData);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, currentStepData, highlightTarget]);

  // Handle window resize
  useEffect(() => {
    if (!isActive || !targetElement || !currentStepData) return;

    const handleResize = () => {
      const position = calculateTooltipPosition(
        targetElement,
        currentStepData.placement || "bottom"
      );
      setTooltipPosition(position);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, targetElement, currentStepData, calculateTooltipPosition]);

  // Handle escape key
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          handleSkip();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextStep();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (!isFirstStep) previousStep();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleSkip, nextStep, previousStep, isFirstStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeHighlight();
    };
  }, [removeHighlight]);

  if (!isActive || !currentStepData || !tooltipPosition) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
          "border border-gray-200 dark:border-gray-700 p-6",
          "transform transition-all duration-300 ease-out",
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-2"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-white dark:bg-gray-800 border rotate-45",
            tooltipPosition.placement === "top" &&
              "bottom-[-6px] left-1/2 transform -translate-x-1/2 border-r border-b border-gray-200 dark:border-gray-700",
            tooltipPosition.placement === "bottom" &&
              "top-[-6px] left-1/2 transform -translate-x-1/2 border-l border-t border-gray-200 dark:border-gray-700",
            tooltipPosition.placement === "left" &&
              "right-[-6px] top-1/2 transform -translate-y-1/2 border-r border-t border-gray-200 dark:border-gray-700",
            tooltipPosition.placement === "right" &&
              "left-[-6px] top-1/2 transform -translate-y-1/2 border-l border-b border-gray-200 dark:border-gray-700"
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>
            </div>
          </div>

          {currentStepData.showSkip && (
            <button
              onClick={handleSkip}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Progress
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {/* Previous button */}
          <button
            onClick={previousStep}
            disabled={isFirstStep || !currentStepData.showPrevious}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
              isFirstStep || !currentStepData.showPrevious
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {/* Skip button (middle) */}
          {currentStepData.showSkip && !isLastStep && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <SkipForward className="h-4 w-4" />
              Skip Tour
            </button>
          )}

          {/* Next/Complete button */}
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLastStep ? (
              <>
                Complete Tour
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tour highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative !important;
          z-index: 45 !important;
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.5),
            0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease-out !important;
        }

        .tour-highlight::before {
          content: "" !important;
          position: absolute !important;
          inset: -4px !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 12px !important;
          animation: tour-pulse 2s infinite !important;
        }

        @keyframes tour-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
};

export default OnboardingTour;
