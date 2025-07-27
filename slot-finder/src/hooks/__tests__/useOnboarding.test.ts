import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "../useOnboarding";

// Mock the storage manager
const mockStorageManager = {
  getUserSettings: jest.fn(),
  getOnboardingData: jest.fn(),
  saveOnboardingData: jest.fn(),
  saveUserSettings: jest.fn(),
  clearOnboardingData: jest.fn(),
};

jest.mock("../../utils/storage", () => ({
  storageManager: mockStorageManager,
}));

describe("useOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageManager.getUserSettings.mockResolvedValue({
      hasCompletedOnboarding: false,
    });
    mockStorageManager.getOnboardingData.mockResolvedValue(null);
    mockStorageManager.saveOnboardingData.mockResolvedValue(undefined);
    mockStorageManager.saveUserSettings.mockResolvedValue(undefined);
    mockStorageManager.clearOnboardingData.mockResolvedValue(undefined);
  });

  it("should initialize with default state", async () => {
    const { result } = renderHook(() => useOnboarding());

    // Wait for loading to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.onboardingState.currentStep).toBe(1);
    expect(result.current.onboardingState.totalSteps).toBe(3);
    expect(result.current.onboardingState.isComplete).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should update user data", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      result.current.updateUserData({ name: "John Doe" });
    });

    expect(result.current.onboardingState.userData.name).toBe("John Doe");
    expect(mockStorageManager.saveOnboardingData).toHaveBeenCalledWith({
      name: "John Doe",
    });
  });

  it("should navigate between steps", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Go to next step
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.onboardingState.currentStep).toBe(2);

    // Go to previous step
    act(() => {
      result.current.previousStep();
    });
    expect(result.current.onboardingState.currentStep).toBe(1);

    // Go to specific step
    act(() => {
      result.current.goToStep(3);
    });
    expect(result.current.onboardingState.currentStep).toBe(3);
  });

  it("should validate step progression", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Step 1 should always allow progression
    expect(result.current.canProceedToNext()).toBe(true);

    // Go to step 2
    act(() => {
      result.current.nextStep();
    });

    // Step 2 should require name
    expect(result.current.canProceedToNext()).toBe(false);

    await act(async () => {
      result.current.updateUserData({ name: "John" });
    });

    expect(result.current.canProceedToNext()).toBe(true);
  });

  it("should complete onboarding", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Set up required data
    await act(async () => {
      result.current.updateUserData({
        name: "John Doe",
        homeCountry: "United States",
        homeTimezone: "America/New_York",
      });
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(mockStorageManager.saveUserSettings).toHaveBeenCalledWith({
      hasCompletedOnboarding: true,
      homeCountry: "United States",
      homeTimezone: "America/New_York",
      homeTimezoneId: expect.stringMatching(/^home_\d+$/),
    });
    expect(mockStorageManager.clearOnboardingData).toHaveBeenCalled();
    expect(result.current.onboardingState.isComplete).toBe(true);
  });

  it("should calculate progress correctly", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.getProgress()).toBe(33.333333333333336); // 1/3 * 100

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.getProgress()).toBe(66.66666666666667); // 2/3 * 100
  });

  it("should handle skip onboarding", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.skipOnboarding();
    });

    expect(mockStorageManager.saveUserSettings).toHaveBeenCalledWith({
      hasCompletedOnboarding: true,
      homeCountry: "Sri Lanka",
      homeTimezone: "Asia/Colombo",
      homeTimezoneId: expect.stringMatching(/^home_\d+$/),
    });
  });

  it("should reset onboarding", async () => {
    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.resetOnboarding();
    });

    expect(mockStorageManager.clearOnboardingData).toHaveBeenCalled();
    expect(mockStorageManager.saveUserSettings).toHaveBeenCalledWith({
      hasCompletedOnboarding: false,
    });
    expect(result.current.onboardingState.currentStep).toBe(1);
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });
});
