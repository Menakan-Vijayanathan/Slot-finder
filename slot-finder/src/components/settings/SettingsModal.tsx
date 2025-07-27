import React, { useState, useCallback } from "react";
import {
  Settings,
  Home,
  Palette,
  Sliders,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";
import DraggableModal from "../draggable/DraggableModal";
import HomeCountryManager from "./HomeCountryManager";
import ConfirmationDialog from "./ConfirmationDialog";
import { SettingsModalProps, UserSettings, Position } from "../../types";
import { cn } from "../../utils";
import { storageManager } from "../../utils/storage";

// Settings tab definitions
interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<SettingsTabProps>;
}

interface SettingsTabProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onClose: () => void;
}

// Tab components with full implementations
const GeneralTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange({ ...settings, ...localSettings });
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure basic application preferences and behavior.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleSettingChange("theme", theme)}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-colors",
                localSettings.theme === theme
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Default Meeting Duration */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Default Meeting Duration (minutes)
        </label>
        <select
          value={localSettings.defaultMeetingDuration}
          onChange={(e) =>
            handleSettingChange(
              "defaultMeetingDuration",
              parseInt(e.target.value)
            )
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      {/* Auto Scroll to Current Time */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-scroll to current time
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Automatically scroll the time slider to show the current time when
            opening
          </p>
        </div>
        <button
          onClick={() =>
            handleSettingChange(
              "autoScrollToCurrentTime",
              !localSettings.autoScrollToCurrentTime
            )
          }
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            localSettings.autoScrollToCurrentTime
              ? "bg-blue-600"
              : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              localSettings.autoScrollToCurrentTime
                ? "translate-x-6"
                : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Show Timezone Flags */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show country flags
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Display country flags next to timezone names
          </p>
        </div>
        <button
          onClick={() =>
            handleSettingChange(
              "showTimezoneFlags",
              !localSettings.showTimezoneFlags
            )
          }
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            localSettings.showTimezoneFlags
              ? "bg-blue-600"
              : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              localSettings.showTimezoneFlags
                ? "translate-x-6"
                : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

const HomeCountryTab: React.FC<SettingsTabProps> = () => (
  <div className="p-6">
    <HomeCountryManager />
  </div>
);

const InterfaceTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange({ ...settings, ...localSettings });
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interface Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize the appearance and behavior of the interface.
        </p>
      </div>

      {/* Working Hours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show working hours
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Highlight working hours on the time slider
            </p>
          </div>
          <button
            onClick={() =>
              handleSettingChange(
                "showWorkingHours",
                !localSettings.showWorkingHours
              )
            }
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              localSettings.showWorkingHours
                ? "bg-blue-600"
                : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                localSettings.showWorkingHours
                  ? "translate-x-6"
                  : "translate-x-1"
              )}
            />
          </button>
        </div>

        {localSettings.showWorkingHours && (
          <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <select
                value={localSettings.workingHoursStart}
                onChange={(e) =>
                  handleSettingChange(
                    "workingHoursStart",
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <select
                value={localSettings.workingHoursEnd}
                onChange={(e) =>
                  handleSettingChange(
                    "workingHoursEnd",
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

const AdvancedTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportSettings = async () => {
    try {
      setIsProcessing(true);
      const exportData = await storageManager.exportSettings();

      // Create and download file
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `world-clock-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSettings = async () => {
    if (!importData.trim()) {
      setImportError("Please paste the settings data");
      return;
    }

    try {
      setIsProcessing(true);
      setImportError("");

      await storageManager.importSettings(importData);

      // Reload settings
      const newSettings = await storageManager.getUserSettings();
      onSettingsChange(newSettings);

      setShowImportDialog(false);
      setImportData("");
    } catch (error) {
      setImportError(
        "Invalid settings data. Please check the format and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setIsProcessing(true);
      await storageManager.resetToDefaults();

      // Reload settings
      const newSettings = await storageManager.getUserSettings();
      onSettingsChange(newSettings);

      setShowResetConfirmation(false);
    } catch (error) {
      console.error("Reset failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Import/export settings and reset to defaults.
        </p>
      </div>

      {/* Export Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Settings
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Download your current settings as a JSON file for backup or sharing.
        </p>
        <button
          onClick={handleExportSettings}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? "Exporting..." : "Export Settings"}
        </button>
      </div>

      {/* Import Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Import Settings
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Import settings from a previously exported JSON file.
        </p>
        <button
          onClick={() => setShowImportDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Settings
        </button>
      </div>

      {/* Reset to Defaults */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Reset to Defaults
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Reset all settings to their default values. This action cannot be
          undone.
        </p>
        <button
          onClick={() => setShowResetConfirmation(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Settings
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste settings JSON data:
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => {
                    setImportData(e.target.value);
                    setImportError("");
                  }}
                  placeholder="Paste your exported settings JSON here..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {importError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  {importError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleImportSettings}
                disabled={isProcessing || !importData.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isProcessing ? "Importing..." : "Import"}
              </button>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData("");
                  setImportError("");
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={handleResetToDefaults}
        title="Reset to Defaults"
        message="Are you sure you want to reset all settings to their default values? This will clear your home country, timezone preferences, and all customizations. This action cannot be undone."
        confirmText="Reset All Settings"
        variant="danger"
      />
    </div>
  );
};

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: "general",
    label: "General",
    icon: Settings,
    component: GeneralTab,
  },
  {
    id: "home-country",
    label: "Home Country",
    icon: Home,
    component: HomeCountryTab,
  },
  {
    id: "interface",
    label: "Interface",
    icon: Palette,
    component: InterfaceTab,
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Sliders,
    component: AdvancedTab,
  },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>("general");
  const [modalPosition, setModalPosition] = useState<Position | undefined>();

  const handlePositionChange = useCallback(
    (position: Position) => {
      setModalPosition(position);
      // Save position to settings
      onSettingsChange({
        ...currentSettings,
        settingsModalPosition: position,
      });
    },
    [currentSettings, onSettingsChange]
  );

  const ActiveTabComponent =
    SETTINGS_TABS.find((tab) => tab.id === activeTab)?.component || GeneralTab;

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      defaultPosition={modalPosition}
      onPositionChange={handlePositionChange}
    >
      <div className="flex h-[700px] max-h-[85vh]">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-2 space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <ActiveTabComponent
            settings={currentSettings}
            onSettingsChange={onSettingsChange}
            onClose={onClose}
          />
        </div>
      </div>
    </DraggableModal>
  );
};

export default SettingsModal;
