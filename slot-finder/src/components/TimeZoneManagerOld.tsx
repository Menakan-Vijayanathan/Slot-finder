import React, { useState } from "react";
import { TimeZone } from "../types";
import { timezoneData } from "../data/timezones";
import { Plus, X, GripVertical, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { COUNTRY_FLAGS } from "../utils/timezone";
import { cn } from "../utils";

interface TimeZoneManagerProps {
  timezones: TimeZone[];
  onAddTimezone: (timezone: TimeZone) => void;
  onRemoveTimezone: (id: string) => void;
  onReorderTimezones: (timezones: TimeZone[]) => void;
}

const TimeZoneManager: React.FC<TimeZoneManagerProps> = ({
  timezones,
  onAddTimezone,
  onRemoveTimezone,
  onReorderTimezones,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredTimezones = timezoneData
    .filter(
      (tz) =>
        tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (tz) =>
        !timezones.some((existing) => existing.iana === tz.iana)
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
    onRemoveTimezone(id);
  };

  // Ensure timezones include home timezone at the top
  const displayTimezones = timezones;

  return (
    <div className="h-full flex flex-col min-h-0" data-tour="timezone-manager">
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
                    const countryFlag = COUNTRY_FLAGS[timezone.country] || "🌍";

                    return (
                      <button
                        key={timezone.iana}
                        onClick={() => handleAddTimezone(timezone)}
                        title={`Add ${timezone.name} timezone`}
                        className={cn(
                          "w-full px-4 py-2 text-left border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-all duration-200",
                          "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                                "text-gray-900 dark:text-white"
                              )}
                            >
                              {timezone.name}
                            </div>
                            <div
                              className={cn(
                                "text-sm",
                                "text-gray-500 dark:text-gray-400"
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

                {displayTimezones.map((timezone, index) => {
                  // Determine if this is the home timezone (first one in the list)
                  const isHome = index === 0;
                  
                  return (
                  <Draggable
                    key={timezone.id}
                    draggableId={timezone.id}
                    index={index}
                  >
                    {(provided, snapshot) => {
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
                            "bg-white/60 dark:bg-gray-800/60",
                            "border border-gray-200/60 dark:border-gray-600/40",
                            "shadow-lg shadow-gray-500/10",
                            "hover:shadow-xl hover:shadow-gray-500/20",
                            // Enhanced dragging state
                            snapshot.isDragging && [
                              "transform rotate-1 scale-110",
                              "shadow-2xl shadow-blue-500/30",
                              "z-50",
                              "ring-2 ring-blue-500/50",
                              "bg-white/90 dark:bg-gray-700/90",
                            ],
                            // Hover effect for non-dragging items
                            !snapshot.isDragging && [
                              "hover:transform hover:scale-105 hover:-translate-y-1",
                              "hover:bg-white/80 dark:hover:bg-gray-700/80",
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
                              <button
                                onClick={() =>
                                  handleRemoveTimezone(timezone.id)
                                }
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Remove timezone"
                              >
                                <X className="w-4 h-4" />
                              </button>
                          </div>
                        </div>
                      );
                    }}
                  </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      </div>
  );
};

export default TimeZoneManager;
