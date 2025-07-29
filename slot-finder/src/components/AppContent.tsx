import React, { useState } from "react";
import TimeSlider from "./TimeSlider";
import TimeZoneManager from "./TimeZoneManager";
import MeetingModal from "./MeetingModal";
import { SettingsModal } from "./settings";
import { useStorage } from "../hooks/useStorage";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { UserSettings } from "../types";
import { Settings } from 'lucide-react';
import { WelcomeModal } from './onboarding';
import { ZonesProvider } from "../context/ZonesContext";
import { UIProvider } from "../context/UIContext";
import { useAuthContext } from "../context/AuthContext";
import { MeetingsProvider } from "../context/MeetingsContext";
import AuthButton from "./AuthButton";
import { SignInButton } from "./SignInButton";

const AppContent: React.FC = () => {
  const { isSignedIn, isLoading } = useAuthContext();
  
  // Debug log when rendering AppContent
  console.log('AppContent render - isSignedIn:', isSignedIn, 'isLoading:', isLoading);
  const [userSettings, setUserSettings] = useStorage<UserSettings>('userSettings', {
    // Home Country
    homeCountry: '',
    homeTimezone: '',
    homeTimezoneId: '',

    // Interface Preferences
    theme: 'system',
    defaultMeetingDuration: 60,
    showWorkingHours: true,
    workingHoursStart: 9,
    workingHoursEnd: 17,

    // Panel Positions
    timezoneManagerPosition: { x: 100, y: 100 },
    meetingModalPosition: { x: 100, y: 100 },
    settingsModalPosition: { x: 100, y: 100 },

    // Other Preferences
    recentEmails: [],
    autoScrollToCurrentTime: true,
    showTimezoneFlags: true,

    // Onboarding flags
    hasCompletedOnboarding: false,
    hasSeenTour: false,
  });

  // Apply theme from userSettings
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (userSettings.theme === 'dark') {
      root.classList.add('dark');
    } else if (userSettings.theme === 'light') {
      root.classList.remove('dark');
    } else if (userSettings.theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [userSettings.theme]);

  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("onboarding_completed") !== "true";
  });

  const currentTime = useCurrentTime();

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setShowMeetingModal(true);
  };

  const handleCreateMeeting = async () => {
    // Meeting creation will be handled in the MeetingModal component
    setShowMeetingModal(false);
    setSelectedTime(null);
  };

  console.log('AppContent render - isSignedIn:', isSignedIn, 'isLoading:', isLoading);

  return (
    <ZonesProvider>
      <UIProvider>
        <MeetingsProvider>
          <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
            {/* Onboarding Modal */}
            <WelcomeModal
              isOpen={showOnboarding}
              onComplete={() => {
                setShowOnboarding(false);
                localStorage.setItem("onboarding_completed", "true");
              }}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black border-b border-gray-800">
              <h1 className="text-xl font-bold text-white">Time Slot Finder</h1>
              <div className="flex items-center space-x-4">
                {isSignedIn ? (
                  <>
                    <AuthButton />
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-1.5 text-gray-300 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <SignInButton />
                )}
              </div>
            </div>

            {/* Main Content - Modern Container */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              {isLoading ? (
                <div className="text-center p-8 max-w-md mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading...</p>
                </div>
              ) : !isSignedIn ? (
                <div className="text-center p-8 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Welcome to Time Slot Finder</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Sign in with your Google account to start finding the perfect meeting times across different time zones.
                  </p>
                  <div className="mt-6">
                    <SignInButton />
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 w-full h-full flex overflow-hidden">
                  {/* Timezone Manager Sidebar */}
                  <div className="w-[28rem] flex-shrink-0 border-r border-gray-200/50 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30">
                    <TimeZoneManager />
                  </div>
                  
                  {/* Time Slider Main Area */}
                  <div className="flex-1 min-w-0 bg-white/50 dark:bg-gray-900/50">
                    <TimeSlider
                      currentTime={currentTime}
                      selectedTime={selectedTime}
                      onTimeSelect={handleTimeSelect}
                      showWorkingHours={userSettings.showWorkingHours}
                      workingHoursStart={userSettings.workingHoursStart}
                      workingHoursEnd={userSettings.workingHoursEnd}
                      showTimezoneFlags={userSettings.showTimezoneFlags}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Modal */}
            {showMeetingModal && selectedTime && (
              <MeetingModal
                selectedTime={selectedTime}
                timezones={[]}
                defaultMeetingDuration={userSettings.defaultMeetingDuration}
                onCreateMeeting={handleCreateMeeting}
                onClose={() => {
                  setShowMeetingModal(false);
                  setSelectedTime(null);
                }}
              />
            )}

            {/* Settings Modal */}
            <SettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              currentSettings={userSettings}
              onSettingsChange={setUserSettings}
            />
          </div>
        </MeetingsProvider>
      </UIProvider>
    </ZonesProvider>
  );
};

export default AppContent;
