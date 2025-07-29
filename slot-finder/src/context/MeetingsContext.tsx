import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meeting } from '../types';

interface MeetingsState {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
}

type MeetingsAction =
  | { type: 'LOAD_MEETINGS'; payload: Meeting[] }
  | { type: 'ADD_MEETING'; payload: Meeting }
  | { type: 'UPDATE_MEETING'; payload: Meeting }
  | { type: 'REMOVE_MEETING'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface MeetingsContextType extends MeetingsState {
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  updateMeeting: (meeting: Meeting) => void;
  removeMeeting: (id: string) => void;
  getMeetingsForTimeSlot: (time: Date) => Meeting[];
  clearError: () => void;
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

const meetingsReducer = (state: MeetingsState, action: MeetingsAction): MeetingsState => {
  switch (action.type) {
    case 'LOAD_MEETINGS':
      return {
        ...state,
        meetings: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_MEETING': {
      const newMeeting: Meeting = {
        ...action.payload,
        id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const newMeetings = [...state.meetings, newMeeting];
      localStorage.setItem('app_meetings', JSON.stringify(newMeetings));

      return {
        ...state,
        meetings: newMeetings,
        error: null,
      };
    }

    case 'UPDATE_MEETING': {
      const updatedMeetings = state.meetings.map(meeting =>
        meeting.id === action.payload.id ? action.payload : meeting
      );
      
      localStorage.setItem('app_meetings', JSON.stringify(updatedMeetings));

      return {
        ...state,
        meetings: updatedMeetings,
        error: null,
      };
    }

    case 'REMOVE_MEETING': {
      const filteredMeetings = state.meetings.filter(meeting => meeting.id !== action.payload);
      localStorage.setItem('app_meetings', JSON.stringify(filteredMeetings));

      return {
        ...state,
        meetings: filteredMeetings,
        error: null,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

interface MeetingsProviderProps {
  children: React.ReactNode;
}

export const MeetingsProvider: React.FC<MeetingsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(meetingsReducer, {
    meetings: [],
    loading: true,
    error: null,
  });

  // Load meetings from localStorage on mount
  useEffect(() => {
    try {
      const savedMeetings = localStorage.getItem('app_meetings');
      const meetings = savedMeetings ? JSON.parse(savedMeetings) : [];
      
      // Convert string dates back to Date objects
      const parsedMeetings = meetings.map((meeting: any) => ({
        ...meeting,
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime),
      }));

      dispatch({ type: 'LOAD_MEETINGS', payload: parsedMeetings });
    } catch (error) {
      console.error('Error loading meetings from localStorage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved meetings' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addMeeting = (meeting: Omit<Meeting, 'id'>) => {
    dispatch({ type: 'ADD_MEETING', payload: meeting as Meeting });
  };

  const updateMeeting = (meeting: Meeting) => {
    dispatch({ type: 'UPDATE_MEETING', payload: meeting });
  };

  const removeMeeting = (id: string) => {
    dispatch({ type: 'REMOVE_MEETING', payload: id });
  };

  const getMeetingsForTimeSlot = (time: Date) => {
    return state.meetings.filter(meeting => {
      const meetingStart = new Date(meeting.startTime);
      const meetingEnd = new Date(meeting.endTime);
      
      // Check if the time slot overlaps with the meeting
      return time >= meetingStart && time < meetingEnd;
    });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: MeetingsContextType = {
    ...state,
    addMeeting,
    updateMeeting,
    removeMeeting,
    getMeetingsForTimeSlot,
    clearError,
  };

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = (): MeetingsContextType => {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingsProvider');
  }
  return context;
};
