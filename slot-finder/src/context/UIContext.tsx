import React, { createContext, useContext, useState, useCallback } from 'react';

interface UIState {
  highlightedHour: number | null; // 0-23 representing the highlighted column, or null for none
  isAutoHighlight: boolean; // Whether to auto-highlight current hour
}

interface UIContextType extends UIState {
  setHighlightedHour: (hour: number | null) => void;
  setNowHighlight: () => void;
  setAutoHighlight: (auto: boolean) => void;
  setPresetHour: (hour: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    highlightedHour: new Date().getHours(),
    isAutoHighlight: true,
  }); // highlightedHour can be null

  const setHighlightedHour = useCallback((hour: number | null) => {
    setState(prev => ({
      ...prev,
      highlightedHour: hour,
      isAutoHighlight: false,
    }));
  }, []);

  const setNowHighlight = useCallback(() => {
    const currentHour = new Date().getHours();
    setState(prev => ({
      ...prev,
      highlightedHour: currentHour,
      isAutoHighlight: true,
    }));
  }, []);

  const setAutoHighlight = useCallback((auto: boolean) => {
    setState(prev => ({
      ...prev,
      isAutoHighlight: auto,
    }));
  }, []);

  const setPresetHour = useCallback((hour: number) => {
    setState(prev => ({
      ...prev,
      highlightedHour: hour,
      isAutoHighlight: false,
    }));
  }, []);

  const value: UIContextType = {
    ...state,
    setHighlightedHour,
    setNowHighlight,
    setAutoHighlight,
    setPresetHour,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

// Preset hours for quick navigation
export const HOUR_PRESETS = [
  { label: 'Now', value: -1, action: 'now' },
  { label: '9 AM', value: 9, action: 'preset' },
  { label: '12 PM', value: 12, action: 'preset' },
  { label: '3 PM', value: 15, action: 'preset' },
  { label: '6 PM', value: 18, action: 'preset' },
] as const;
