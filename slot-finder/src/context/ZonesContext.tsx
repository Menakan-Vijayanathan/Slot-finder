import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TimeZone } from '../types';

interface ZonesState {
  zones: TimeZone[];
  homeCountry: string;
  homeTimezone: string;
  loading: boolean;
  error: string | null;
}

type ZonesAction =
  | { type: 'LOAD_ZONES'; payload: TimeZone[] }
  | { type: 'ADD_ZONE'; payload: Omit<TimeZone, 'id'> }
  | { type: 'REMOVE_ZONE'; payload: string }
  | { type: 'REORDER_ZONES'; payload: TimeZone[] }
  | { type: 'SET_HOME_COUNTRY'; payload: { country: string; timezone: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface ZonesContextType extends ZonesState {
  addZone: (zone: Omit<TimeZone, 'id'>) => void;
  removeZone: (id: string) => void;
  reorderZones: (zones: TimeZone[]) => void;
  setHomeCountry: (country: string, timezone: string) => void;
  getHomeTimezone: () => TimeZone | null;
  clearError: () => void;
}

const ZonesContext = createContext<ZonesContextType | undefined>(undefined);

const zonesReducer = (state: ZonesState, action: ZonesAction): ZonesState => {
  switch (action.type) {
    case 'LOAD_ZONES':
      return {
        ...state,
        zones: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_HOME_COUNTRY': {
      // Update existing zones to remove home designation
      const updatedZones = state.zones.map(zone => ({ ...zone, isHome: false }));
      
      // Add or update home timezone
      const existingHomeIndex = updatedZones.findIndex(zone => zone.iana === action.payload.timezone);
      
      if (existingHomeIndex >= 0) {
        updatedZones[existingHomeIndex].isHome = true;
        // Move to front
        const homeZone = updatedZones.splice(existingHomeIndex, 1)[0];
        updatedZones.unshift(homeZone);
      } else {
        // Add new home timezone from timezoneData
        const newHomeZone: TimeZone = {
          id: `home_${Date.now()}`,
          name: action.payload.country,
          iana: action.payload.timezone,
          label: action.payload.country,
          country: action.payload.country,
          isHome: true,
        };
        updatedZones.unshift(newHomeZone);
      }
      
      localStorage.setItem('app_timezones', JSON.stringify(updatedZones));
      localStorage.setItem('app_home_country', action.payload.country);
      localStorage.setItem('app_home_timezone', action.payload.timezone);
      
      return {
        ...state,
        zones: updatedZones,
        homeCountry: action.payload.country,
        homeTimezone: action.payload.timezone,
        error: null,
      };
    }

    case 'ADD_ZONE': {
      // Check for duplicates by IANA timezone
      const isDuplicate = state.zones.some(
        zone => zone.iana === action.payload.iana
      );
      
      if (isDuplicate) {
        return {
          ...state,
          error: `${action.payload.name} timezone is already added`,
        };
      }

      const newZone: TimeZone = {
        ...action.payload,
        id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const newZones = [...state.zones, newZone];
      
      // Persist to localStorage
      localStorage.setItem('app_timezones', JSON.stringify(newZones));
      
      return {
        ...state,
        zones: newZones,
        error: null,
      };
    }

    case 'REMOVE_ZONE': {
      const filteredZones = state.zones.filter(zone => zone.id !== action.payload);
      
      // Persist to localStorage
      localStorage.setItem('app_timezones', JSON.stringify(filteredZones));
      
      return {
        ...state,
        zones: filteredZones,
        error: null,
      };
    }

    case 'REORDER_ZONES': {
      // Persist to localStorage
      localStorage.setItem('app_timezones', JSON.stringify(action.payload));
      
      return {
        ...state,
        zones: action.payload,
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

interface ZonesProviderProps {
  children: React.ReactNode;
}

export const ZonesProvider: React.FC<ZonesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(zonesReducer, {
    zones: [],
    homeCountry: '',
    homeTimezone: '',
    loading: true,
    error: null,
  });

  // Load zones and home country from localStorage on mount
  useEffect(() => {
    try {
      const savedZones = localStorage.getItem('app_timezones');
      const savedHomeCountry = localStorage.getItem('app_home_country') || 'Sri Lanka';
      const savedHomeTimezone = localStorage.getItem('app_home_timezone') || 'Asia/Colombo';
      
      let zones = savedZones ? JSON.parse(savedZones) : [];
      
      // Ensure home timezone exists
      if (zones.length === 0) {
        zones = [
          {
            id: 'default_home',
            name: 'Colombo',
            iana: 'Asia/Colombo',
            label: 'Sri Lanka',
            country: 'Sri Lanka',
            isHome: true,
          }
        ];
      }
      
      dispatch({ type: 'LOAD_ZONES', payload: zones });
      dispatch({ type: 'SET_HOME_COUNTRY', payload: { country: savedHomeCountry, timezone: savedHomeTimezone } });
    } catch (error) {
      console.error('Error loading zones from localStorage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved timezones' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addZone = (zone: Omit<TimeZone, 'id'>) => {
    dispatch({ type: 'ADD_ZONE', payload: zone });
  };

  const removeZone = (id: string) => {
    dispatch({ type: 'REMOVE_ZONE', payload: id });
  };

  const reorderZones = (zones: TimeZone[]) => {
    dispatch({ type: 'REORDER_ZONES', payload: zones });
  };

  const setHomeCountry = (country: string, timezone: string) => {
    dispatch({ type: 'SET_HOME_COUNTRY', payload: { country, timezone } });
  };

  const getHomeTimezone = (): TimeZone | null => {
    return state.zones.find(zone => zone.isHome) || null;
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: ZonesContextType = {
    ...state,
    addZone,
    removeZone,
    reorderZones,
    setHomeCountry,
    getHomeTimezone,
    clearError,
  };

  return (
    <ZonesContext.Provider value={value}>
      {children}
    </ZonesContext.Provider>
  );
};

export const useZones = (): ZonesContextType => {
  const context = useContext(ZonesContext);
  if (context === undefined) {
    throw new Error('useZones must be used within a ZonesProvider');
  }
  return context;
};
