import { useState, useEffect } from "react";

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if Chrome extension API is available
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

  // Load initial value from chrome storage or localStorage
  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage.sync.get([key]).then((result) => {
        if (result[key] !== undefined) {
          setValue(result[key]);
        }
        setIsLoaded(true);
      });
    } else {
      // Fallback to localStorage for development
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
      setIsLoaded(true);
    }
  }, [key, isChromeExtension]);

  // Listen for storage changes
  useEffect(() => {
    if (!isChromeExtension) return;

    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes[key]) {
        setValue(changes[key].newValue ?? defaultValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [key, defaultValue, isChromeExtension]);

  // Update storage when value changes
  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const valueToStore =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;

      if (isLoaded) {
        if (isChromeExtension) {
          chrome.storage.sync.set({ [key]: valueToStore });
        } else {
          // Fallback to localStorage for development
          try {
            localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (error) {
            console.warn('Failed to save to localStorage:', error);
          }
        }
      }

      return valueToStore;
    });
  };

  return [value, setStoredValue];
}
