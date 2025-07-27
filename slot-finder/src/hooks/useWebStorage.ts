import { useState, useEffect } from "react";

export function useWebStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof newValue === "function"
        ? (newValue as (prev: T) => T)(prev)
        : newValue
    );
  };

  return [value, setStoredValue];
}
