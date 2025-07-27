import React, { useState, useMemo } from "react";
import TimeZoneManager from "./TimeZoneManager";
import TimeSlider from "./TimeSlider";
import MeetingModal from "./MeetingModal";
import { SettingsModal } from "./settings";
import { useStorage } from "../hooks/useStorage";
import { useAuth } from "../hooks/useAuth";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { useHomeCountry } from "../hooks/useHomeCountry";
import { TimeZone, UserSettings } from "../types";
import { Settings, User } from "lucide-react";
import { WelcomeModal } from "./onboarding";

const App: React.FC = () => {
  // ...all hooks and state declarations...
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
  const [timezones, setTimezones] = useStorage<TimeZone[]>("timezones", [
    {
      id: "1",
      name: "Colombo",
      iana: "Asia/Colombo",
      label: "Sri Lanka",
      country: "Sri Lanka",
    },
  ]);

  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // User settings state with defaults

  const currentTime = useCurrentTime();
  const { user, signIn, signOut, isSignedIn } = useAuth();
  const homeCountryHook = useHomeCountry();

  // Memoize the timezones list for TimeSlider to prevent unnecessary re-renders
  const memoizedTimezones = useMemo(
    () => homeCountryHook.addHomeTimezoneToList(timezones),
    [timezones, homeCountryHook]
  );

  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding if not completed (localStorage flag)
    return localStorage.getItem("onboarding_completed") !== "true";
  });

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setShowMeetingModal(true);
  };

  const handleCreateMeeting = async () => {
    // Meeting creation will be handled in the MeetingModal component
    setShowMeetingModal(false);
    setSelectedTime(null);
  };

  const handleAddTimezone = (timezone: TimeZone) => {
    setTimezones((prev) => [...prev, timezone]);
  };

  const handleRemoveTimezone = (id: string) => {
    setTimezones((prev) => prev.filter((tz) => tz.id !== id));
  };

  const handleReorderTimezones = (newOrder: TimeZone[]) => {
    setTimezones(newOrder);
  };

  return (
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
        <img
          src="/logo/slot-finder-high-resolution-logo-transparent.png"
          alt="Slot Finder Logo"
          className="w-32 h-23"
        />

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <img
                src={user?.picture}
                alt={user?.name}
                className="w-6 h-6 rounded-full"
              />
              <button
                onClick={signOut}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              title="Sign up or sign in with Google"
            >
              <User className="w-4 h-4" />
              Sign Up / Sign In
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 text-gray-300 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content - Modern Container */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 w-full max-w-[90rem] h-5/6 flex overflow-hidden">
          {/* Timezone Manager */}
          <div className="w-[28rem] flex flex-col h-full min-h-0 bg-gradient-to-b from-gray-50/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 border-r border-gray-200/60 dark:border-gray-700/40">
            <TimeZoneManager
              timezones={timezones}
              onAddTimezone={handleAddTimezone}
              onRemoveTimezone={handleRemoveTimezone}
              onReorderTimezones={handleReorderTimezones}
              homeCountryHook={homeCountryHook}
            />
          </div>

          {/* Time Slider */}
          <div className="flex-1 min-w-0 bg-gradient-to-b from-white/30 to-gray-50/30 dark:from-gray-900/30 dark:to-gray-800/30">
            <TimeSlider
  timezones={memoizedTimezones}
  currentTime={currentTime}
  selectedTime={selectedTime}
  onTimeSelect={handleTimeSelect}
  homeCountryHook={homeCountryHook}
  autoScrollToCurrentTime={userSettings.autoScrollToCurrentTime}
  showWorkingHours={userSettings.showWorkingHours}
  workingHoursStart={userSettings.workingHoursStart}
  workingHoursEnd={userSettings.workingHoursEnd}
  showTimezoneFlags={userSettings.showTimezoneFlags}
/>
          </div>
        </div>
      </div>

      {/* Meeting Modal */}
      {showMeetingModal && selectedTime && (
        <MeetingModal
          selectedTime={selectedTime}
          timezones={timezones}
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
  );
};

export default App;
