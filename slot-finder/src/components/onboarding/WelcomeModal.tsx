import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Globe,
  User,
  Mail,
} from "lucide-react";
import { WelcomeModalProps, OnboardingData } from "../../types";
import { useOnboarding } from "../../hooks/useOnboarding";
import CountrySelector from "./CountrySelector";
import { cn } from "../../utils";

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onComplete }) => {
  const {
    onboardingState,
    updateUserData,
    nextStep,
    previousStep,
    completeOnboarding,
    canProceedToNext,
    getProgress,
    isLastStep,
    isFirstStep,
    skipOnboarding,
  } = useOnboarding();

  const [errors, setErrors] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when step changes
  useEffect(() => {
    setErrors({});
  }, [onboardingState.currentStep]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<OnboardingData> = {};
    const { currentStep, userData } = onboardingState;

    switch (currentStep) {
      case 1: // Welcome step - no validation needed
        return true;

      case 2: // Personal info step
        if (!userData.name || userData.name.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters long";
        }
        if (
          userData.email &&
          userData.email.trim() &&
          !isValidEmail(userData.email)
        ) {
          newErrors.email = "Please enter a valid email address";
        }
        break;

      case 3: // Home country step
        if (!userData.homeCountry) {
          newErrors.homeCountry = "Please select your home country";
        }
        if (!userData.homeTimezone) {
          newErrors.homeTimezone = "Home timezone is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  // Handle form completion
  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const completedData = await completeOnboarding();
      onComplete(completedData);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    try {
      await skipOnboarding();
      // The hook will handle calling onComplete with default data
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    updateUserData({ [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle country selection
  const handleCountryChange = (country: string, timezone: string) => {
    updateUserData({
      homeCountry: country,
      homeTimezone: timezone,
    });
    // Clear errors for country fields
    setErrors((prev) => ({
      ...prev,
      homeCountry: undefined,
      homeTimezone: undefined,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4 bg-white dark:bg-gray-800",
          "rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700",
          "transform transition-all duration-300 ease-out",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className={cn(
              "absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600",
              "dark:text-gray-500 dark:hover:text-gray-300",
              "transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            aria-label="Skip onboarding"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Step {onboardingState.currentStep} of{" "}
                {onboardingState.totalSteps}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(getProgress())}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-out",
                  "bg-gradient-to-r from-blue-500 to-cyan-500"
                )}
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Step 1: Welcome */}
          {onboardingState.currentStep === 1 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to World Clock Meet Helper
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Let's get you set up with your home country and timezone
                preferences to make scheduling meetings across time zones
                effortless.
              </p>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {onboardingState.currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tell us about yourself
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This helps us personalize your experience
                </p>
              </div>

              <div className="space-y-4">
                {/* Name field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={onboardingState.userData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    placeholder="Enter your full name"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-colors duration-200",
                      errors.name
                        ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
                      "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={onboardingState.userData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      placeholder="your.email@example.com"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-lg",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "transition-colors duration-200",
                        errors.email
                          ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
                        "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Home Country Selection */}
          {onboardingState.currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Select your home country
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This will be your primary timezone for scheduling meetings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home Country *
                </label>
                <CountrySelector
                  value={onboardingState.userData.homeCountry || ""}
                  onChange={handleCountryChange}
                  placeholder="Search and select your country..."
                  showFlags={true}
                />
                {errors.homeCountry && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.homeCountry}
                  </p>
                )}

                {/* Show selected timezone */}
                {onboardingState.userData.homeTimezone && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Selected timezone:</strong>{" "}
                      {onboardingState.userData.homeTimezone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Previous button */}
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg",
                "transition-all duration-200",
                isFirstStep
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {/* Next/Complete button */}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={!canProceedToNext() || isSubmitting}
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg",
                "transition-all duration-200",
                canProceedToNext() && !isSubmitting
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : isLastStep ? (
                <>
                  Complete Setup
                  <Check className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default WelcomeModal;
