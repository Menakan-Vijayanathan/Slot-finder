import moment from 'moment';

// Enhanced TimeZone interface with home country support
export interface TimeZone {
  id: string;
  name: string;
  iana: string;
  label: string;
  country: string;
  isHome?: boolean; // New field to identify home timezone
  flag?: string; // Country flag emoji or URL
  flagEmoji?: string; // Emoji for the flag (for UI)
  countryCode?: string; // ISO country code (for UI)
}

// Meeting interface for tracking scheduled meetings
export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  timezone: string; // IANA timezone
  attendees: string[];
  color?: string; // Color for the meeting indicator
}

// Time period indicators
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

// Enhanced grid slot data
export interface TimeSlotData {
  time: Date;
  originalTime: moment.Moment; // Keep moment object for calculations
  localTime: Date;
  timezone: TimeZone;
  period: TimePeriod;
  isWorkingHour: boolean;
  meetings: Meeting[];
  isDifferentDay: boolean;
}

export interface MeetingDetails {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  timezone: string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

// Onboarding system types
export interface OnboardingData {
  name: string;
  email: string;
  homeCountry: string;
  homeTimezone: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  userData: Partial<OnboardingData>;
  isComplete: boolean;
}

// Enhanced User Settings
export interface UserSettings {
  // Onboarding
  hasCompletedOnboarding: boolean;
  hasSeenTour: boolean;

  // Home Country
  homeCountry: string;
  homeTimezone: string;
  homeTimezoneId: string;

  // Interface Preferences
  theme: "light" | "dark" | "system";
  defaultMeetingDuration: number;
  showWorkingHours: boolean;
  workingHoursStart: number; // 24-hour format
  workingHoursEnd: number;

  // Panel Positions
  timezoneManagerPosition?: { x: number; y: number };
  meetingModalPosition?: { x: number; y: number };
  settingsModalPosition?: { x: number; y: number };

  // Other Preferences
  recentEmails: string[];
  autoScrollToCurrentTime: boolean;
  showTimezoneFlags: boolean;
}

// Draggable system types
export interface Position {
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  currentPosition: Position;
  offset: Position;
}

export interface DraggableOptions {
  constrainToParent?: boolean;
  disabled?: boolean;
  handle?: string;
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
}

// Component prop interfaces
export interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: (userData: OnboardingData) => void;
}

export interface CountrySelectorProps {
  value: string;
  onChange: (country: string, timezone: string) => void;
  placeholder?: string;
  showFlags?: boolean;
}

export interface DraggablePanelProps {
  children: React.ReactNode;
  title: string;
  defaultPosition?: Position;
  onPositionChange?: (position: Position) => void;
  constrainToParent?: boolean;
  className?: string;
}

export interface DraggableModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultPosition?: Position;
  onPositionChange?: (position: Position) => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

// Tour step definition
export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  showSkip?: boolean;
  showPrevious?: boolean;
}

// Country data interface
export interface CountryData {
  name: string;
  code: string;
  timezone: string;
  flag: string;
}
