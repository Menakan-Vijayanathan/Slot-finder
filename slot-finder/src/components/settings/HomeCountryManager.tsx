import React, { useState } from "react";
import { Home, AlertTriangle, Check, X } from "lucide-react";
import { useZones } from "../../context/ZonesContext";
import CountrySelector from "../onboarding/CountrySelector";
import { timezoneData } from "../../data/timezones";
import { COUNTRY_FLAGS } from "../../utils/timezone";
import { cn } from "../../utils";

const HomeCountryManager: React.FC = () => {
  const {
    homeCountry,
    homeTimezone,
    loading: isLoading,
    error,
    setHomeCountry,
    getHomeTimezone,
  } = useZones();

  const hasHomeCountry = Boolean(homeCountry && homeTimezone);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(homeCountry);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewTimezone, setPreviewTimezone] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  // Handle country selection
  const handleCountrySelect = (countryName: string, timezone: string) => {
    setSelectedCountry(countryName);
    setValidationError(null);

    // Find timezone info from our data
    const timezoneInfo = timezoneData.find(tz => tz.iana === timezone);
    if (!timezoneInfo) {
      setValidationError("Invalid timezone selection");
      setPreviewTimezone(null);
    } else {
      setPreviewTimezone({
        name: timezoneInfo.name,
        iana: timezone,
        country: countryName,
        label: timezoneInfo.label
      });
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setSelectedCountry(homeCountry);
      setValidationError(null);
      setPreviewTimezone(null);
      setShowConfirmation(false);
    }
    setIsEditing(!isEditing);
  };

  // Handle save changes
  const handleSave = () => {
    if (!selectedCountry || validationError) {
      return;
    }

    // If the country hasn't changed, just exit edit mode
    if (selectedCountry === homeCountry) {
      setIsEditing(false);
      return;
    }

    // Show confirmation dialog for changes
    setShowConfirmation(true);
  };

  // Confirm the home country change
  const handleConfirmChange = async () => {
    if (!selectedCountry || !previewTimezone) return;

    setIsChanging(true);
    try {
      setHomeCountry(selectedCountry, previewTimezone.iana);
      
      setIsEditing(false);
      setShowConfirmation(false);
      setPreviewTimezone(null);
      setValidationError(null);
    } catch (error) {
      setValidationError("Failed to change home country");
    } finally {
      setIsChanging(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const currentHomeTimezone = getHomeTimezone();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Home Country
        </h3>
      </div>

      {/* Current Home Country Display */}
      {!isEditing && hasHomeCountry && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {COUNTRY_FLAGS[homeCountry] || "🌍"}
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {homeCountry}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {homeTimezone} • {currentHomeTimezone?.name || 'Home Timezone'}
                </p>
              </div>
            </div>
            <button
              onClick={handleEditToggle}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* No Home Country Set */}
      {!isEditing && !hasHomeCountry && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                No home country set
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Set your home country to get personalized timezone defaults
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Set Home Country
          </button>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select your home country
            </label>

            <CountrySelector
              value={selectedCountry}
              onChange={handleCountrySelect}
              placeholder="Choose your home country..."
              showFlags={true}
            />

            {/* Validation Error */}
            {validationError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <X className="h-4 w-4" />
                {validationError}
              </div>
            )}

            {/* Preview */}
            {previewTimezone && !validationError && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <span>
                    This will set your home timezone to{" "}
                    <strong>{previewTimezone.name}</strong> (
                    {previewTimezone.iana})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedCountry || !!validationError || isChanging}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedCountry && !validationError
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              )}
            >
              {isChanging ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={handleEditToggle}
              disabled={isChanging}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Home Country Change
              </h4>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to change your home country from{" "}
                <strong>{homeCountry}</strong> to{" "}
                <strong>{selectedCountry}</strong>?
              </p>

              {previewTimezone && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>New home timezone:</strong> {previewTimezone.name} (
                    {previewTimezone.iana})
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will update your home timezone and may affect meeting
                scheduling defaults.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmChange}
                disabled={isChanging}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isChanging ? "Changing..." : "Yes, Change"}
              </button>

              <button
                onClick={handleCancelConfirmation}
                disabled={isChanging}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isEditing && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Error loading home country
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeCountryManager;
