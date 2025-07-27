import { useState, useCallback, useEffect } from "react";
import { OnboardingData, OnboardingState, UserSettings } from "../types";
import { storageManager } from "../utils/storage";

const TOTAL_ONBOARDING_STEPS = 3;

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 1,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    userData: {},
    isComplete: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Load onboarding status on mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const settings = await storageManager.getUserSettings();
        const savedData = await storageManager.getOnboardingData();

        setHasCompletedOnboarding(settings.hasCompletedOnboarding);

        if (savedData && !settings.hasCompletedOnboarding) {
          setOnboardingState((prev) => ({
            ...prev,
            userData: savedData,
          }));
        }
      } catch (error) {
        console.error("Error loading onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingStatus();
  }, []);

  // Save onboarding data whenever it changes
  const saveOnboardingData = useCallback(
    async (data: Partial<OnboardingData>) => {
      try {
        await storageManager.saveOnboardingData(data);
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    },
    []
  );

  // Update user data for current step
  const updateUserData = useCallback(
    (data: Partial<OnboardingData>) => {
      setOnboardingState((prev) => {
        const newUserData = { ...prev.userData, ...data };
        saveOnboardingData(newUserData);
        return {
          ...prev,
          userData: newUserData,
        };
      });
    },
    [saveOnboardingData]
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    setOnboardingState((prev) => {
      if (prev.currentStep < prev.totalSteps) {
        return {
          ...prev,
          currentStep: prev.currentStep + 1,
        };
      }
      return prev;
    });
  }, []);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    setOnboardingState((prev) => {
      if (prev.currentStep > 1) {
        return {
          ...prev,
          currentStep: prev.currentStep - 1,
        };
      }
      return prev;
    });
  }, []);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_ONBOARDING_STEPS) {
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, []);

  // Complete onboarding process
  const completeOnboarding = useCallback(
    async (finalData?: Partial<OnboardingData>) => {
      try {
        const completeUserData = { ...onboardingState.userData, ...finalData };

        // Validate required fields
        if (
          !completeUserData.name ||
          !completeUserData.homeCountry ||
          !completeUserData.homeTimezone
        ) {
          throw new Error("Missing required onboarding data");
        }

        // Update user settings to mark onboarding as complete
        const settingsUpdate: Partial<UserSettings> = {
          hasCompletedOnboarding: true,
          homeCountry: completeUserData.homeCountry,
          homeTimezone: completeUserData.homeTimezone,
          homeTimezoneId: `home_${Date.now()}`,
        };

        await storageManager.saveUserSettings(settingsUpdate);

        // Clear temporary onboarding data
        await storageManager.clearOnboardingData();

        setOnboardingState((prev) => ({
          ...prev,
          userData: completeUserData as OnboardingData,
          isComplete: true,
        }));

        setHasCompletedOnboarding(true);

        return completeUserData as OnboardingData;
      } catch (error) {
        console.error("Error completing onboarding:", error);
        throw error;
      }
    },
    [onboardingState.userData]
  );

  // Reset onboarding (for testing or re-onboarding)
  const resetOnboarding = useCallback(async () => {
    try {
      await storageManager.clearOnboardingData();
      await storageManager.saveUserSettings({ hasCompletedOnboarding: false });

      setOnboardingState({
        currentStep: 1,
        totalSteps: TOTAL_ONBOARDING_STEPS,
        userData: {},
        isComplete: false,
      });

      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      throw error;
    }
  }, []);

  // Skip onboarding (set minimal defaults)
  const skipOnboarding = useCallback(async () => {
    try {
      const defaultData: OnboardingData = {
        name: "User",
        email: "",
        homeCountry: "Sri Lanka",
        homeTimezone: "Asia/Colombo",
      };

      await completeOnboarding(defaultData);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      throw error;
    }
  }, [completeOnboarding]);

  // Check if current step is valid
  const canProceedToNext = useCallback(() => {
    const { currentStep, userData } = onboardingState;

    switch (currentStep) {
      case 1: // Welcome step
        return true; // No validation needed for welcome
      case 2: // Personal info step
        return !!(userData.name && userData.name.trim());
      case 3: // Home country step
        return !!(userData.homeCountry && userData.homeTimezone);
      default:
        return false;
    }
  }, [onboardingState]);

  // Get step progress percentage
  const getProgress = useCallback(() => {
    return (onboardingState.currentStep / onboardingState.totalSteps) * 100;
  }, [onboardingState.currentStep, onboardingState.totalSteps]);

  // Check if we're on the last step
  const isLastStep = onboardingState.currentStep === onboardingState.totalSteps;
  const isFirstStep = onboardingState.currentStep === 1;

  return {
    // State
    onboardingState,
    isLoading,
    hasCompletedOnboarding,
    isLastStep,
    isFirstStep,

    // Actions
    updateUserData,
    nextStep,
    previousStep,
    goToStep,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,

    // Helpers
    canProceedToNext,
    getProgress,
  };
}
