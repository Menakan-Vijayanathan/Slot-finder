# Time Zone Table Strategic Refactor Plan

## 1. Core Feature Recap
- **24-hour horizontal table** for each selected time zone.
- **Top row** is the reference zone (home or default).
- Clicking an hour in the top row sets the **reference hour**.
- All other rows highlight the hour that matches the reference hour in their local time.
- Each cell is colored by day period (morning, afternoon, evening, night).

## 2. Current Logic Review
- **State Management:**
  - `UIContext` holds `highlightedHour` and related setters.
  - Clicking a time slot updates this global state.
- **Time Conversion:**
  - Uses Luxon and/or Moment.js for time zone conversion.
  - `generateEnhancedTimeGrid` (in both `timezoneUtils.ts` and `timezoneUtilsV2.ts`) generates grid data for all zones and hours.
- **Highlighting:**
  - Each row renders 24 cells; highlight logic is based on matching the local hour to the reference hour.
- **Color Coding:**
  - Uses `getTimePeriod` and `getPeriodColor` for cell styling.

## 3. Refactor/Correction Plan
### A. Reference Hour Alignment
- When a user clicks an hour in the top row (reference zone):
  - Store the hour as `highlightedHour` in context.
  - For each other zone:
    - Convert the reference zone's selected hour to that zone's local hour (same absolute instant).
    - Highlight the cell in that row whose local hour matches the converted hour.
- **Implementation:**
  - Use `moment-timezone` (as per `timezoneUtilsV2.ts`) for conversion:
    - Construct a date in the reference zone at the selected hour.
    - Convert to each target zone.
    - Find the local hour and highlight the corresponding cell.

### B. UI/UX Adjustments
- **Move calendar** to the left corner in `TimeSlider`.
- **Move time selection** section accordingly.
- **Remove S4 hour section** (if present).
- **Do not change data changer section.**

### C. Period Coloring
- Continue using `getTimePeriod` and `getPeriodColor` for cell backgrounds.
- Use country-specific logic if available.

### D. Integration
- Integrate new logic into the table rendering, ensuring that the highlight and color logic are applied per the above.
- Do not disrupt existing data management or meeting features.

## 4. Implementation Steps
1. **Audit** the table rendering logic in `TimeSlider.tsx`.
2. **Update** the grid data generation to:
   - Use the reference hour as the anchor.
   - For each zone, compute the local hour corresponding to the reference hour in the base zone.
   - Highlight the correct cell in each row.
3. **Refactor UI** in `TimeSlider` to move calendar and time selection as specified.
4. **Test** with multiple zones and edge cases (DST, non-integer offsets).

## 5. Technical Notes
- **Conversion Example:**
  ```js
  // Reference: America/New_York, hour: 9
  const refDate = moment.tz({ hour: 9, minute: 0 }, 'America/New_York');
  const localInTokyo = refDate.clone().tz('Asia/Tokyo');
  const localHour = localInTokyo.hour();
  ```
- **Highlight Logic:**
  - For each zone row, highlight the cell where `cell.hour === localHour`.
- **Color Logic:**
  - For each cell, use `getTimePeriod(cell.hour, zone.country)` and `getPeriodColor`.

---

**This file is a living reference for ongoing work. Update as needed.**
