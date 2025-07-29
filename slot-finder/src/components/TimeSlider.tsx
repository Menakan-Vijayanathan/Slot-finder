import React, { useMemo, useState, useEffect, useRef } from "react";
import moment from "moment-timezone";
import { Clock, Calendar } from "lucide-react";
import { cn } from "../utils";
import { useZones } from "../context/ZonesContext";
import { useUI } from "../context/UIContext";
import { useMeetings } from "../context/MeetingsContext";
import { getTimePeriod, getPeriodIcon, getPeriodColor } from "../utils/timezoneUtilsV2";
import MeetingModal from "./MeetingModal"; // Added import

type TimeSliderProps = {
  currentTime: Date;
  selectedTime: Date | null;
  onTimeSelect: (time: Date) => void;
  showWorkingHours: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
  showTimezoneFlags: boolean;
  isHomeSlider?: boolean;
};

const TimeSlider: React.FC<TimeSliderProps> = ({
  currentTime,
  selectedTime,
  onTimeSelect,
  showWorkingHours,
  workingHoursStart,
  workingHoursEnd,
  showTimezoneFlags,
  isHomeSlider = false
}) => {
  const { zones } = useZones();
  const { highlightedHour, setHighlightedHour, isAutoHighlight, setNowHighlight } = useUI();
  const { meetings } = useMeetings();
  const [selectedDate, setSelectedDate] = useState(moment());
  const [is24HourFormat, setIs24HourFormat] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Modal state
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [selectedMeetingTime, setSelectedMeetingTime] = useState<Date | null>(null);

  // Handler to open modal
  const handleMeetingClick = (meeting: any, time: moment.Moment) => {
    setSelectedMeeting(meeting);
    setSelectedMeetingTime(time.toDate());
    setIsMeetingModalOpen(true);
  };

  // Handler to close modal
  const handleCloseMeetingModal = () => {
    setIsMeetingModalOpen(false);
    setSelectedMeeting(null);
    setSelectedMeetingTime(null);
  };

  // Helper: Get start hour for a period
  const getPeriodStartHour = (period: string, country?: string) => {
    switch ((country || '').toLowerCase()) {
      case 'india':
        if (period === 'morning') return 5;
        if (period === 'afternoon') return 12;
        if (period === 'evening') return 16;
        if (period === 'night') return 21;
        break;
      default:
        if (period === 'morning') return 6;
        if (period === 'afternoon') return 12;
        if (period === 'evening') return 17;
        if (period === 'night') return 21;
    }
    return 0;
  };

  // Handler: When a period label is clicked
  const handlePeriodClick = (period: string) => {
    setSelectedPeriod(period);
    let hourToHighlight: number | null = null;
    if (period === 'now') {
      let homeNow;
      if (referenceZone) {
        homeNow = moment.tz(Date.now(), referenceZone.iana);
      } else {
        homeNow = moment(); // fallback to local time
      }
      hourToHighlight = homeNow.hour();
    } else {
      const homeCountry = referenceZone?.country;
      hourToHighlight = getPeriodStartHour(period, homeCountry);
    }
    if (typeof hourToHighlight === 'number' && setHighlightedHour) {
      setHighlightedHour(hourToHighlight);
    }
  };

  // Refs for scroll synchronization
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // Sync scroll position when scrollLeft changes
  useEffect(() => {
    if (scrollContentRef.current) {
      scrollContentRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  // Find the reference (home) zone
  const referenceZone = useMemo(() => {
    return zones.find(z => z.isHome) || zones[0];
  }, [zones]);

  const alignedGridByZone = useMemo(() => {
    if (!referenceZone) return {};
    const result: { [zoneId: string]: { localTime: moment.Moment; homeHour: number; isDifferentDay: boolean; isWorkingHour: boolean; meetings: any[] }[] } = {};
    for (const zone of zones) {
      result[zone.id] = [];
      for (let homeHour = 0; homeHour < 24; homeHour++) {
        const homeMoment = moment.tz({
          year: selectedDate.year(),
          month: selectedDate.month(),
          day: selectedDate.date(),
          hour: homeHour,
          minute: 0,
          second: 0,
        }, referenceZone.iana);
        const localMoment = homeMoment.clone().tz(zone.iana);
        const slotMeetings = meetings.filter((meeting: any) => {
          const meetingStart = moment(meeting.startTime).tz(zone.iana);
          const meetingEnd = moment(meeting.endTime).tz(zone.iana);
          return (
            meeting.timezone === zone.iana &&
            localMoment.isSameOrAfter(meetingStart) &&
            localMoment.isBefore(meetingEnd)
          );
        });
        result[zone.id].push({
          localTime: localMoment,
          homeHour,
          isDifferentDay: !localMoment.isSame(homeMoment, 'day'),
          isWorkingHour: localMoment.hour() >= 9 && localMoment.hour() < 17,
          meetings: slotMeetings,
        });
      }
    }
    return result;
  }, [zones, referenceZone, selectedDate, meetings]);

  useEffect(() => {
    if (isAutoHighlight) {
      const currentHour = new Date().getHours();
      setNowHighlight();
    }
  }, [isAutoHighlight, setNowHighlight]);

  // Time slot click handler
  const handleTimeSlotClick = (slot: moment.Moment) => {
    setSelectedPeriod(null);
    setHighlightedHour(null);
    if (onTimeSelect) {
      onTimeSelect(slot.toDate());
    }
  };

  const goPrevDay = () => {
    setSelectedDate(selectedDate.clone().subtract(1, 'day'));
  };

  const goNextDay = () => {
    setSelectedDate(selectedDate.clone().add(1, 'day'));
  };

  const goToToday = () => {
    setSelectedDate(moment());
  };

  const getZoneColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500',
      'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full min-w-0" data-tour="time-slider">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-semibold text-lg">Time Slider</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open('https://calendar.google.com', '_blank')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              title="Open Google Calendar"
            >
              Google Calendar
            </button>
            <button
              onClick={() => setIs24HourFormat((prev: boolean) => !prev)}
              className="px-2 py-1 border rounded text-sm"
              title="Toggle 24h/12h format"
            >
              {is24HourFormat ? '24h' : '12h'}
            </button>
        </div>
      </div>

      {/* Time Segment Labels Row */}
      <div className="flex justify-center gap-4 py-2 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200/50 dark:border-gray-700/30">
        {['now', 'morning', 'afternoon', 'evening', 'night'].map((period) => (
          <button
            key={period}
            onClick={() => handlePeriodClick(period)}
            className={cn(
              'px-3 py-1 rounded-full font-medium transition',
              selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200',
              'hover:bg-blue-100 dark:hover:bg-blue-800'
            )}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>
      {/* Date Navigation */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrevDay}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedDate.format("MMMM D, YYYY")}
            </span>
            {!selectedDate.isSame(moment(), 'day') && (
              <button
                onClick={goToToday}
                className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={goNextDay}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Date Band */}
        <div className="flex justify-center gap-1">
          {[selectedDate.clone().subtract(3, 'days'), selectedDate.clone().subtract(2, 'days'), selectedDate.clone().subtract(1, 'days'), selectedDate, selectedDate.clone().add(1, 'days'), selectedDate.clone().add(2, 'days'), selectedDate.clone().add(3, 'days')].map((date, idx) => {
            const isDateToday = date.isSame(moment(), 'day');
            const isSelected = date.isSame(selectedDate, 'day');

            return (
              <button
                key={date.format("YYYY-MM-DD")}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200 text-xs",
                  isSelected
                    ? "bg-blue-500 text-white shadow-lg"
                    : isDateToday
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span className="font-medium">{date.format("ddd")}</span>
                <span className="text-lg font-bold">{date.format("DD")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col min-h-0 overflow-auto"
        onScroll={handleScroll}
      >
        {/* Scrollable Content */}
        <div 
          ref={scrollContentRef}
          className="w-[1728px]"
          style={{
            position: 'relative',
            transform: `translateX(-${scrollLeft}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {zones.map((zone, zoneIndex) => {
            const zoneData = alignedGridByZone[zone.id] || [];
            const isHome = zone.isHome || false;
            const zoneColor = getZoneColor(zoneIndex);

            return (
              <div
                key={zone.id}
                data-zone-id={zone.id}
                className={cn(
                  "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 relative",
                  isHome && "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30"
                )}
              >
                {/* Color Connection Strip */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-60 transition-all duration-200",
                    zoneColor
                  )}
                  data-zone-color={zoneColor}
                />
                {/* Time Slots - Full Width */}
                <div className="ml-1">
                  <div className="flex">
                    {zoneData.map((slot, hourIndex) => {
                      const period = getTimePeriod(slot.localTime.hour(), zone.country);
                      const periodIcon = getPeriodIcon(period, zone.country);
                      const periodColor = getPeriodColor(period);

                      return (
                        <div
                          key={hourIndex}
                          className={cn(
                            "w-18 p-2 h-16 border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 text-center relative",
                            selectedTime &&
                              slot.localTime.year() === moment(selectedTime).year() &&
                              slot.localTime.month() === moment(selectedTime).month() &&
                              slot.localTime.date() === moment(selectedTime).date() &&
                              slot.localTime.hour() === moment(selectedTime).hour()
                              ? [
                                  "bg-blue-500 text-white border-blue-700",
                                  "ring-2 ring-blue-400",
                                ]
                              : (selectedPeriod && slot.homeHour === highlightedHour)
                                ? [
                                    "bg-blue-500 text-white border-blue-700",
                                    "ring-2 ring-blue-400",
                                  ]
                                : [
                                    "bg-white dark:bg-gray-900",
                                    "border-gray-200 dark:border-gray-700",
                                  ],
                            slot.isDifferentDay && [
                              "ring-1 ring-orange-400/30",
                            ]
                          )}
                          style={{ width: '72px' }}
                          onClick={() => handleTimeSlotClick(slot.localTime)}
                        >
                          {/* Time Display */}
                          <div className={cn(
                            "text-xs font-medium mb-0.5",
                            slot.isWorkingHour && "text-green-700 dark:text-green-300"
                          )}>
                            {slot.localTime.format(is24HourFormat ? 'HH:mm' : 'hh:mm A')}
                          </div>
                          {/* Period Indicator */}
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-[10px] opacity-60">{periodIcon}</span>
                            <span className={cn(
                              "text-[10px] font-medium",
                              periodColor
                            )}>
                              {period.toUpperCase()}
                            </span>
                          </div>
                          {/* Meeting Indicators */}
                          {slot.meetings && slot.meetings.length > 0 && (
  <div className="flex justify-center gap-1 mb-1">
    {slot.meetings.slice(0, 3).map((meeting: any, idx: number) => (
      <div
        key={idx}
        className="w-2 h-2 rounded-full bg-red-500 shadow-sm cursor-pointer"
        title={`Meeting: ${meeting.title}`}
        onClick={e => {
          e.stopPropagation();
          handleMeetingClick(meeting, slot.localTime);
        }}
      />
    ))}
    {slot.meetings.length > 3 && (
      <div className="text-xs text-red-600 dark:text-red-400 font-medium">
        +{slot.meetings.length - 3}
      </div>
    )}
  </div>
)}
                          {/* Day Change Indicator */}
                          {slot.isDifferentDay && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {slot.localTime.format("MMM DD")}
                            </div>
                          )}
                          {/* Working Hours Indicator */}
                          {slot.isWorkingHour && (
                            <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {zones.length === 0 && (
            <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No time zones added</p>
                <p className="text-sm mt-1 opacity-60">
                  Add time zones to see the comparison grid
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Meeting Modal */}
    {isMeetingModalOpen && selectedMeetingTime && (
      <MeetingModal
        selectedTime={selectedMeetingTime}
        timezones={zones}
        onCreateMeeting={() => {}}
        onClose={handleCloseMeetingModal}
        defaultMeetingDuration={60}
      />
    )}
  </div>
  );
};

export default TimeSlider;
