import React, { useMemo, useRef, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { TimeZone } from "../types";
import { useHomeCountry } from "../hooks/useHomeCountry";
import { isWorkingHours } from "../utils/timezone";
import { cn } from "../utils";

interface TimeSliderProps {
  timezones: TimeZone[];
  currentTime: Date;
  selectedTime: Date | null;
  onTimeSelect: (time: Date) => void;
  homeCountryHook: ReturnType<
    typeof import("../hooks/useHomeCountry").useHomeCountry
  >;
  autoScrollToCurrentTime: boolean;
  showWorkingHours: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
  showTimezoneFlags: boolean;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  timezones,
  currentTime,
  selectedTime,
  onTimeSelect,
  homeCountryHook,
  autoScrollToCurrentTime,
  showWorkingHours,
  workingHoursStart,
  workingHoursEnd,
  showTimezoneFlags,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timezoneRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasAutoScrolled = useRef(false); // Flag to prevent multiple auto-scrolls
  
  // Initialize refs array when timezones change
  useEffect(() => {
    timezoneRowRefs.current = new Array(timezones.length).fill(null);
  }, [timezones.length]);

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(
    DateTime.now().startOf("day")
  );

  // Home country management for working hours
  const { getHomeTimezone } = homeCountryHook;
  const homeTimezone = getHomeTimezone();

  // Generate 24-hour time slots for selected date
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(selectedDate.plus({ hours: hour }));
    }
    return slots;
  }, [selectedDate]);

  // Calculate current time position for marker
  const currentTimePosition = useMemo(() => {
    const now = DateTime.fromJSDate(currentTime);
    const minutesFromStart = now.hour * 60 + now.minute;
    const totalMinutesInDay = 24 * 60;
    return (minutesFromStart / totalMinutesInDay) * 100;
  }, [currentTime]);

  // Auto-scroll to current time only when appropriate
  useEffect(() => {
    if (
      autoScrollToCurrentTime &&
      !hasAutoScrolled.current &&
      selectedDate.hasSame(DateTime.now(), "day") // Only auto-scroll if viewing today
    ) {
      const timer = setTimeout(() => {
        if (scrollRef.current && currentTimePosition !== null) {
          const scrollPosition =
            (currentTimePosition / 100) * scrollRef.current.scrollWidth;
          const targetScroll = Math.max(
            0,
            scrollPosition - scrollRef.current.clientWidth / 2
          );

          // Auto-scroll to current time for header
          scrollRef.current.scrollTo({
            left: targetScroll,
            behavior: "smooth",
          });

          // Sync all timezone rows
          timezoneRowRefs.current.forEach((ref) => {
            if (ref) {
              ref.scrollTo({
                left: targetScroll,
                behavior: "smooth",
              });
            }
          });

          // Mark that we've auto-scrolled
          hasAutoScrolled.current = true;
        }
      }, 200); // Slightly longer delay to ensure proper rendering

      return () => clearTimeout(timer);
    }
  }, [selectedDate, autoScrollToCurrentTime]); // Only run when selected date or setting changes

  const getTimeInTimezone = (slot: DateTime, timezone: TimeZone) => {
    return slot.setZone(timezone.iana);
  };

  const isTimeSlotSelected = (slot: DateTime) => {
    if (!selectedTime) return false;
    const selectedSlot = DateTime.fromJSDate(selectedTime);
    return (
      slot.hasSame(selectedSlot, "hour") && slot.hasSame(selectedSlot, "day")
    );
  };

  const handleTimeSlotClick = (slot: DateTime) => {
    onTimeSelect(slot.toJSDate());
  };

  // Check if a time slot is within working hours (based on home timezone)
  const isWorkingHoursSlot = (slot: DateTime) => {
    if (!showWorkingHours || !homeTimezone) return false;
    // Convert slot to home timezone
    const homeTime = slot.setZone(homeTimezone.iana);
    return isWorkingHours(homeTime.hour, workingHoursStart, workingHoursEnd);
  };


  // Date navigation
  const goPrevDay = () => {
    setSelectedDate(selectedDate.minus({ days: 1 }));
    hasAutoScrolled.current = false; // Allow auto-scroll on day change
  };
  const goNextDay = () => {
    setSelectedDate(selectedDate.plus({ days: 1 }));
    hasAutoScrolled.current = false; // Allow auto-scroll on day change
  };

  // Date pagination band (7 days: 3 before, selected, 3 after)
  const dateBand = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      arr.push(selectedDate.plus({ days: i }));
    }
    return arr;
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-full min-w-0" data-tour="time-slider">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .time-scroll::-webkit-scrollbar {
          height: 6px;
          background: transparent;
        }
        .time-scroll::-webkit-scrollbar-thumb {
          background: rgba(120,120,120,0.15);
          border-radius: 6px;
        }
        .time-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(120,120,120,0.25);
        }
        .time-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .time-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(120,120,120,0.15) transparent;
          cursor: grab;
        }
        .time-scroll:active {
          cursor: grabbing;
        }
      `}</style>

      {/* Header Section */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <img
                src="/icons/alarm-clock.png"
                alt="Clock"
                className="w-6 h-6"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Time Finder
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Find the perfect meeting time
              </p>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Current Time
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {DateTime.fromJSDate(currentTime).toFormat("HH:mm:ss")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {DateTime.fromJSDate(currentTime).toFormat("ccc, LLL dd")}
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-3 py-6 px-6 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/30">
        <button
          onClick={goPrevDay}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200/60 dark:border-gray-600/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex gap-2">
          {dateBand.map((date, idx) => {
            const isToday = date.hasSame(DateTime.now(), "day");
            const isSelected = date.hasSame(selectedDate, "day");

            return (
              <button
                key={date.toISODate()}
                onClick={() => {
                  setSelectedDate(date);
                  hasAutoScrolled.current = false; // Allow auto-scroll on date change
                }}
                className={cn(
                  "relative flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-200 backdrop-blur-sm min-w-[60px]",
                  isSelected
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-blue-400/50 shadow-lg shadow-blue-500/30 scale-105"
                    : isToday
                      ? "bg-gradient-to-br from-orange-400 to-red-500 text-white border-orange-400/50 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/30"
                      : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 border-gray-200/60 dark:border-gray-600/40 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:scale-105 hover:shadow-lg"
                )}
              >
                {/* Today indicator */}
                {isToday && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 border-2 border-white rounded-full animate-pulse"></div>
                )}

                <span className="text-xs font-medium opacity-80">
                  {date.toFormat("ccc")}
                </span>
                <span className="text-base font-semibold">
                  {date.toFormat("dd")}
                </span>

                {/* Today label */}
                {isToday && (
                  <span className="text-[10px] font-bold opacity-90 mt-0.5">
                    {isSelected ? "TODAY" : "TODAY"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={goNextDay}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-lg border border-gray-200/60 dark:border-gray-600/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Legends Section */}
      <div className="border-b border-gray-200/50 dark:border-gray-700/30">
        {/* Current Date Indicator */}
        {!selectedDate.hasSame(DateTime.now(), "day") && (
          <div className="px-6 py-2 bg-gradient-to-r from-orange-50/60 to-yellow-50/60 dark:from-orange-900/10 dark:to-yellow-900/10">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-5 h-5 bg-orange-500 rounded-lg shadow-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-orange-700 dark:text-orange-300 font-medium">
                Viewing {selectedDate.toFormat("EEEE, MMMM dd")} • Current time
                indicator hidden
              </span>
            </div>
          </div>
        )}

        {/* Working Hours Legend */}
        {homeTimezone && (
          <div className="px-6 py-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-green-700 dark:text-green-300 font-medium">
                Working hours: 9 AM - 5 PM in {homeTimezone.country}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Time Grid Header */}
      <div className="sticky top-0 bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/40 z-20 shadow-sm">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden relative time-scroll"
          style={{
            minWidth: "100%",
            width: "max(100%, 1536px)",
          }}
          onScroll={(e) => {
            if (timezoneRowRefs.current.length > 0) {
              timezoneRowRefs.current.forEach((ref) => {
                if (
                  ref &&
                  Math.abs(ref.scrollLeft - e.currentTarget.scrollLeft) > 1
                ) {
                  ref.scrollLeft = e.currentTarget.scrollLeft;
                }
              });
            }
          }}
        >
          {/* Slim, compact current time marker (only if viewing today) */}
          {currentTimePosition !== null &&
            selectedDate.hasSame(DateTime.now(), "day") && (
              <>
                <div
                  className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                  style={{ left: `${currentTimePosition}%`, width: "0" }}
                >
                  {/* Slim marker line with subtle glow */}
                  <div className="w-1 h-full bg-gradient-to-b from-red-500 via-orange-500 to-red-500 shadow-lg relative">
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-full bg-red-500/10 blur-md"
                      style={{ zIndex: 0 }}
                    ></div>
                  </div>
                  {/* Compact floating label above marker */}
                  <div className="relative -top-5 flex flex-col items-center z-40">
                    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-lg shadow font-bold border border-red-400/50 backdrop-blur-sm animate-pulse">
                      {DateTime.fromJSDate(currentTime).toFormat("HH:mm")}{" "}
                      <span className="ml-1 text-[10px] font-semibold">
                        NOW
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          {timeSlots.map((slot, index) => {
            const isCurrentHour =
              currentTimePosition !== null &&
              selectedDate.hasSame(DateTime.now(), "day") &&
              Math.floor(currentTimePosition / (100 / 24)) === index;

            return (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 w-16 p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-all duration-200 relative",
                  isCurrentHour &&
                    "bg-gradient-to-br from-red-100/60 to-orange-100/40 dark:from-red-900/30 dark:to-orange-900/30 border-red-300 dark:border-red-600 shadow-lg"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrentHour
                      ? "text-red-700 dark:text-red-300 font-bold"
                      : "text-gray-900 dark:text-white"
                  )}
                >
                  {isCurrentHour
                    ? DateTime.fromJSDate(currentTime).toFormat("HH:mm")
                    : slot.toFormat("HH:mm")}
                </div>
                {/* Remove the old NOW label from here, as it's now in the marker */}
              </div>
            );
          })}
        </div>
      </div>
      {/* Timezone Grid */}
      <div className="flex-1 overflow-y-auto">
        {timezones.map((timezone, timezoneIndex) => {
          const isHomeTimezone = timezone.isHome;

          return (
            <div
              key={timezone.id}
              className="timezone-row border-b border-gray-100/50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors duration-200"
            >
              <div className="flex">
                {/* Enhanced timezone label */}
                <div
                  className={cn(
                    "flex-shrink-0 w-52 p-5 border-r border-gray-200/60 dark:border-gray-700/40 transition-all duration-200",
                    isHomeTimezone
                      ? "bg-gradient-to-r from-blue-500/8 to-cyan-500/8 dark:from-blue-400/15 dark:to-cyan-400/15 border-blue-200/60 dark:border-blue-600/40"
                      : "bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 hover:from-gray-50/80 hover:to-white/80 dark:hover:from-gray-700/80 dark:hover:to-gray-800/80"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {timezone.flag && (
                      <span className="text-lg">{timezone.flag}</span>
                    )}
                    <div
                      className={cn(
                        "font-medium transition-colors",
                        isHomeTimezone
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white"
                      )}
                    >
                      {timezone.name}
                    </div>
                    {isHomeTimezone && (
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          HOME
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-sm transition-colors",
                      isHomeTimezone
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {showTimezoneFlags && timezone.flagEmoji && (
                      <span className="tz-flag" title={timezone.countryCode || ''}>
                        {timezone.flagEmoji}
                      </span>
                    )}
                    {timezone.label}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-1 transition-colors",
                      isHomeTimezone
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {getTimeInTimezone(selectedDate, timezone).toFormat(
                      "ccc, LLL dd"
                    )}
                  </div>
                </div>
                <div
                  ref={(el) => {
                    timezoneRowRefs.current[timezoneIndex] = el;
                  }}
                  className="flex-1 overflow-x-auto overflow-y-hidden time-scroll"
                  onScroll={(e) => {
                    if (
                      scrollRef.current &&
                      Math.abs(
                        scrollRef.current.scrollLeft -
                          e.currentTarget.scrollLeft
                      ) > 1
                    ) {
                      scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                    }
                    timezoneRowRefs.current.forEach((ref, idx) => {
                      if (
                        ref &&
                        ref !== e.currentTarget &&
                        Math.abs(ref.scrollLeft - e.currentTarget.scrollLeft) >
                          1
                      ) {
                        ref.scrollLeft = e.currentTarget.scrollLeft;
                      }
                    });
                  }}
                >
                  <div
                    className="flex relative"
                    style={{ minWidth: `${24 * 64}px` }}
                  >
                    {timeSlots.map((slot, idx) => {
                      const localTime = getTimeInTimezone(slot, timezone);
                      const isDiffDay = !localTime.hasSame(slot, "day");
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "time-slot flex-shrink-0 w-16 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer transition-all duration-200 relative",
                            // Working hours highlighting
                            isWorkingHoursSlot(slot) && [
                              "bg-green-50 dark:bg-green-900/20",
                              "hover:bg-green-100 dark:hover:bg-green-900/30",
                              "border-green-200 dark:border-green-800",
                            ],
                            // Selected time highlighting (takes precedence)
                            isTimeSlotSelected(slot) && [
                              "bg-cyan-100 dark:bg-cyan-900/40",
                              "border-cyan-300 dark:border-cyan-700",
                              "shadow-sm",
                            ],
                            // Regular hover effect for non-working hours
                            !isWorkingHoursSlot(slot) &&
                              !isTimeSlotSelected(slot) && [
                                "hover:bg-gray-100 dark:hover:bg-gray-800",
                                "hover:scale-105 hover:shadow-sm",
                              ],
                            // Enhanced visual feedback
                            "active:scale-95 active:bg-blue-100 dark:active:bg-blue-900/30"
                          )}
                          onClick={() => handleTimeSlotClick(slot)}
                          data-tour={
                            timezone.id === timezones[0]?.id && idx === 10
                              ? "time-slot"
                              : undefined
                          }
                        >
                          <div className="text-center">
                            <div
                              className={cn(
                                "text-sm font-medium transition-colors",
                                isTimeSlotSelected(slot)
                                  ? "text-cyan-700 dark:text-cyan-300"
                                  : isWorkingHoursSlot(slot)
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-gray-900 dark:text-white"
                              )}
                            >
                              {localTime.toFormat("HH:mm")}
                            </div>
                            <div
                              className={cn(
                                "text-xs transition-colors",
                                isTimeSlotSelected(slot)
                                  ? "text-cyan-600 dark:text-cyan-400"
                                  : isWorkingHoursSlot(slot)
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {localTime.toFormat("ccc")}
                            </div>
                            {isDiffDay && (
                              <div className="text-xs text-indigo-400 dark:text-cyan-300 font-semibold">
                                {localTime.toFormat("LLL dd")}
                              </div>
                            )}

                            {/* Working hours indicator dot */}
                            {isWorkingHoursSlot(slot) &&
                              !isTimeSlotSelected(slot) && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full"></div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlider;
