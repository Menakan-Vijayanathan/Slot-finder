import React, { useState } from "react";
import { TimeZone } from "../types";
import { timezoneData } from "../data/timezones";
import { Plus, X, GripVertical, Search, Home } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { COUNTRY_FLAGS } from "../utils/timezone";
import { cn } from "../utils";
import CountrySelector from "./onboarding/CountrySelector";

interface TimeZoneManagerProps {
  timezones: TimeZone[];
  onAddTimezone: (timezone: TimeZone) => void;
  onRemoveTimezone: (id: string) => void;
  onReorderTimezones: (timezones: TimeZone[]) => void;
  homeCountryHook: ReturnType<typeof import("../hooks/useHomeCountry").useHomeCountry>;
}

const TimeZoneManager: React.FC<TimeZoneManagerProps> = ({
  timezones,
  onAddTimezone,
  onRemoveTimezone,
  onReorderTimezones,
  homeCountryHook,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showHomeTimezoneModal, setShowHomeTimezoneModal] = useState(false);
  const [isChangingHome, setIsChangingHome] = useState(false);
  const [pendingHomeCountry, setPendingHomeCountry] = useState<string>("");
  const [pendingHomeTimezone, setPendingHomeTimezone] = useState<string>("");
  const [changeError, setChangeError] = useState<string | null>(null);

  // Home country management (from prop)
  const {
    isHomeTimezone,
    addHomeTimezoneToList,
    homeCountry,
    changeHomeCountry,
    homeTimezone,
    isLoading: homeLoading,
    getAvailableCountries,
  } = homeCountryHook;

  const filteredTimezones = timezoneData
    .filter(
      (tz) =>
        tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (tz) =>
        !timezones.some((existing) => existing.iana === tz.iana) &&
        tz.iana !== homeTimezone // Exclude home timezone
    );

  const handleAddTimezone = (timezone: Omit<TimeZone, "id">) => {
    const newTimezone: TimeZone = {
      ...timezone,
      id: Date.now().toString(),
    };
    onAddTimezone(newTimezone);
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(timezones);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderTimezones(items);
  };

  // Handle timezone removal with home timezone protection
  const handleRemoveTimezone = (id: string) => {
    if (isHomeTimezone(id)) {
      // Show modal explaining why home timezone cannot be removed
      setShowHomeTimezoneModal(true);
      return;
    }
    onRemoveTimezone(id);
  };

  // Ensure timezones include home timezone at the top
  const displayTimezones = addHomeTimezoneToList(timezones);

  return (
    <div className="h-full flex flex-col min-h-0" data-tour="timezone-manager">
      {/* Home Country Selector */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/30 bg-gradient-to-r from-blue-50/40 to-cyan-50/20 dark:from-blue-900/10 dark:to-cyan-900/10 flex items-center gap-4">
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          Home Country:
        </span>
        <CountrySelector
          value={pendingHomeCountry || homeCountry}
          onChange={(country, timezone) => {
            setPendingHomeCountry(country);
            setPendingHomeTimezone(timezone);
            setChangeError(null);
          }}
          placeholder="Select your home country..."
        />
        <button
          className="ml-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={
            homeLoading ||
            !pendingHomeCountry ||
            pendingHomeCountry === homeCountry
          }
          onClick={async () => {
            if (!pendingHomeCountry) return;
            const result = await changeHomeCountry(pendingHomeCountry);
            if (!result.success) {
              setChangeError(result.error || "Failed to change home country");
            } else {
              setPendingHomeCountry("");
              setPendingHomeTimezone("");
              setChangeError(null);
            }
          }}
        >
          Save
        </button>
        {homeLoading && (
          <span className="ml-2 text-xs text-gray-500">Saving...</span>
        )}
        {changeError && (
          <span className="ml-2 text-xs text-red-500">{changeError}</span>
        )}
      </div>
      {/* Custom Scrollbar Styles */}
      <style>{`
        .timezone-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .timezone-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .timezone-scroll::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        .timezone-scroll::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }
        .dark .timezone-scroll::-webkit-scrollbar-track {
          background: #374151;
        }
        .dark .timezone-scroll::-webkit-scrollbar-thumb {
          background: #9ca3af;
        }
        .dark .timezone-scroll::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        .timezone-scroll {
          scrollbar-width: thin;
          scrollbar-color: #6b7280 #f3f4f6;
        }
        .dark .timezone-scroll {
          scrollbar-color: #9ca3af #374151;
        }
      `}</style>
      {/* Header Section */}
      <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <img src="/icons/world.png" alt="World" className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Time Zones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your preferred locations worldwide
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            "flex items-center justify-center gap-3 w-full px-6 py-4 text-base font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1",
            isSearchOpen
              ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white"
          )}
          data-tour="add-timezone"
        >
          {isSearchOpen ? (
            <>
              <X className="w-5 h-5" />
              Close Search
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Timezone
            </>
          )}
        </button>
      </div>

      {/* Search Section */}
      {isSearchOpen && (
        <div className="p-8 bg-gradient-to-r from-gray-50/80 to-blue-50/40 dark:from-gray-800/60 dark:to-blue-900/20 border-b border-gray-200/50 dark:border-gray-700/30">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for cities, countries, or timezones..."
              className="w-full pl-14 pr-6 py-4 text-base border-2 border-gray-200/60 dark:border-gray-600/40 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/50 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              autoFocus
            />

            {searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto timezone-scroll">
                {filteredTimezones.length > 0 ? (
                  filteredTimezones.slice(0, 10).map((timezone) => {
                    // Check if this timezone's country matches the user's home country
                    const isHomeCountryTimezone =
                      timezone.country === homeCountry;
                    // Get country flag from the COUNTRY_FLAGS mapping
                    const countryFlag = COUNTRY_FLAGS[timezone.country] || "🌍";

                    return (
                      <button
                        key={timezone.iana}
                        onClick={() => handleAddTimezone(timezone)}
                        title={
                          isHomeCountryTimezone
                            ? `${timezone.name} is in your home country (${timezone.country})`
                            : `Add ${timezone.name} timezone`
                        }
                        className={cn(
                          "w-full px-4 py-2 text-left border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-all duration-200",
                          isHomeCountryTimezone
                            ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 border-blue-200 dark:border-blue-700"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {/* Country flag */}
                          <span className="text-lg flex-shrink-0">
                            {countryFlag}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "font-medium flex items-center gap-2",
                                isHomeCountryTimezone
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-gray-900 dark:text-white"
                              )}
                            >
                              {timezone.name}
                              {/* Home country indicator */}
                              {isHomeCountryTimezone && (
                                <div className="flex items-center gap-1">
                                  <Home className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    Home Country
                                  </span>
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                "text-sm",
                                isHomeCountryTimezone
                                  ? "text-blue-700 dark:text-blue-300"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {timezone.label} • {timezone.country}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    No timezones found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timezone List */}
      <div className="flex-1 overflow-y-auto timezone-scroll">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timezones">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "min-h-full transition-all duration-300 p-4",
                  // Enhanced drop zone styling
                  snapshot.isDraggingOver && [
                    "bg-blue-500/5 dark:bg-blue-400/10",
                    "border-2 border-dashed border-blue-400/50 dark:border-blue-500/40",
                    "rounded-xl",
                    "ring-2 ring-blue-500/20",
                  ]
                )}
              >
                {displayTimezones.length === 0 && (
                  <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <p className="text-lg font-medium">No timezones yet</p>
                      <p className="text-sm mt-1 opacity-60">
                        Add your first timezone to get started
                      </p>
                    </div>
                  </div>
                )}

                {displayTimezones.map((timezone, index) => (
                  <Draggable
                    key={timezone.id}
                    draggableId={timezone.id}
                    index={index}
                  >
                    {(provided, snapshot) => {
                      const isHome =
                        timezone.isHome || isHomeTimezone(timezone.id);

                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            // Add smooth transitions for non-dragging state
                            ...(snapshot.isDragging
                              ? {}
                              : {
                                  transform: "none",
                                  transition: "all 0.2s ease-out",
                                }),
                          }}
                          className={cn(
                            "flex items-center justify-between p-6 transition-all duration-200 ease-out",
                            // Base styling with modern glass effect
                            "rounded-2xl mx-4 mb-4 backdrop-blur-sm",
                            // Home timezone styling
                            isHome && [
                              "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20",
                              "border border-blue-200/60 dark:border-blue-400/30",
                              "shadow-lg shadow-blue-500/20",
                              "ring-1 ring-blue-500/20",
                            ],
                            // Regular timezone styling
                            !isHome && [
                              "bg-white/60 dark:bg-gray-800/60",
                              "border border-gray-200/60 dark:border-gray-600/40",
                              "shadow-lg shadow-gray-500/10",
                              "hover:shadow-xl hover:shadow-gray-500/20",
                            ],
                            // Enhanced dragging state
                            snapshot.isDragging && [
                              "transform rotate-1 scale-110",
                              "shadow-2xl shadow-blue-500/30",
                              "z-50",
                              "ring-2 ring-blue-500/50",
                              isHome
                                ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                                : "bg-white/90 dark:bg-gray-700/90",
                            ],
                            // Hover effect for non-dragging items
                            !snapshot.isDragging && [
                              "hover:transform hover:scale-105 hover:-translate-y-1",
                              isHome
                                ? "hover:shadow-xl hover:shadow-blue-500/30"
                                : "hover:bg-white/80 dark:hover:bg-gray-700/80",
                            ]
                          )}
                          data-tour={index === 0 ? "timezone-card" : undefined}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              {...provided.dragHandleProps}
                              className={cn(
                                "cursor-grab active:cursor-grabbing transition-all duration-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700",
                                // Enhanced drag handle styling
                                "hover:scale-110 active:scale-95",
                                snapshot.isDragging &&
                                  "cursor-grabbing scale-110",
                                isHome
                                  ? "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              )}
                            >
                              <GripVertical
                                className={cn(
                                  "w-5 h-5 transition-transform duration-200",
                                  snapshot.isDragging && "animate-pulse"
                                )}
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Country flag if available */}
                              {timezone.flag && (
                                <span className="text-2xl">
                                  {timezone.flag}
                                </span>
                              )}

                              {/* Home icon for home timezone */}
                              {isHome && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    Home
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "font-semibold text-base transition-colors truncate",
                                  isHome
                                    ? "text-blue-900 dark:text-blue-100"
                                    : "text-gray-900 dark:text-white"
                                )}
                              >
                                {timezone.name}
                              </div>
                              <div
                                className={cn(
                                  "text-sm transition-colors",
                                  isHome
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {timezone.label}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Home timezone cannot be removed */}
                            {isHome ? (
                              <button
                                onClick={() =>
                                  handleRemoveTimezone(timezone.id)
                                }
                                className="p-1 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
                                title="Home timezone cannot be removed. Click to learn more."
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleRemoveTimezone(timezone.id)
                                }
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Remove timezone"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Home Timezone Protection Modal */}
      {showHomeTimezoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cannot Remove Home Timezone
              </h4>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Your home timezone ({homeCountry}) cannot be removed as it
                serves as your primary reference for meeting scheduling and time
                comparisons.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>To change your home timezone:</strong> Go to Settings
                  and select a different home country.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowHomeTimezoneModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeZoneManager;
