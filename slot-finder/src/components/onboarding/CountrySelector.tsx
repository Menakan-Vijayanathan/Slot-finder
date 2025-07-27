import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, MapPin } from "lucide-react";
import { CountrySelectorProps } from "../../types";
import {
  getUniqueCountries,
  getTimezoneForCountry,
} from "../../utils/timezone";
import { cn } from "../../utils";
const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select your country...",
  showFlags = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const countries = getUniqueCountries();

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Popular countries to show at the top
  const popularCountries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Singapore",
    "India",
    "Sri Lanka",
  ];

  const popularCountryData = popularCountries
    .map((name) => countries.find((c) => c.name === name))
    .filter(Boolean);

  const otherCountries = filteredCountries.filter(
    (country) => !popularCountries.includes(country.name)
  );

  // Get display name for selected country
  const selectedCountry = countries.find((c) => c.name === value);
  const displayValue = selectedCountry ? selectedCountry.name : "";

  // Handle country selection
  const handleSelect = (countryName: string) => {
    const timezone = getTimezoneForCountry(countryName);
    if (timezone) {
      onChange(countryName, timezone.iana);
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  };
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
          handleSelect(filteredCountries[highlightedIndex].name);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div ref={dropdownRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {selectedCountry && showFlags ? (
            <span className="text-lg mr-2">{selectedCountry.flag}</span>
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-3 text-left bg-white dark:bg-gray-700",
            "border border-gray-300 dark:border-gray-600 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
            "transition-colors duration-200"
          )}
          autoComplete="country"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        </div>
      </div>{" "}
      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 bg-white dark:bg-gray-700",
            "border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg",
            "max-h-60 overflow-y-auto"
          )}
        >
          {filteredCountries.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No countries found
            </div>
          ) : (
            <ul ref={listRef} className="py-1">
              {/* Popular Countries Section */}
              {searchTerm === "" && popularCountryData.length > 0 && (
                <>
                  <li className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Popular Countries
                  </li>
                  {popularCountryData.map((country, index) => (
                    <li key={`popular-${country!.name}`}>
                      <button
                        onClick={() => handleSelect(country!.name)}
                        className={cn(
                          "w-full px-4 py-2 text-left flex items-center gap-3",
                          "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                          "text-gray-900 dark:text-white",
                          index === highlightedIndex &&
                            "bg-blue-100 dark:bg-blue-900/50"
                        )}
                      >
                        {showFlags && (
                          <span className="text-lg">{country!.flag}</span>
                        )}
                        <span>{country!.name}</span>
                      </button>
                    </li>
                  ))}

                  {otherCountries.length > 0 && (
                    <li className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-t border-gray-200 dark:border-gray-600 mt-1">
                      Other Countries
                    </li>
                  )}
                </>
              )}
              {/* All Countries or Search Results */}
              {(searchTerm !== "" ? filteredCountries : otherCountries).map(
                (country, index) => {
                  const actualIndex =
                    searchTerm !== ""
                      ? index
                      : popularCountryData.length + index;
                  return (
                    <li key={country.name}>
                      <button
                        onClick={() => handleSelect(country.name)}
                        className={cn(
                          "w-full px-4 py-2 text-left flex items-center gap-3",
                          "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                          "text-gray-900 dark:text-white",
                          actualIndex === highlightedIndex &&
                            "bg-blue-100 dark:bg-blue-900/50"
                        )}
                      >
                        {showFlags && (
                          <span className="text-lg">{country.flag}</span>
                        )}
                        <span>{country.name}</span>
                      </button>
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
