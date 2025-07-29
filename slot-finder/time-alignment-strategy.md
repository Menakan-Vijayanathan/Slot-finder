# Time Zone Table: True Current-Time Alignment Strategy

## Problem

The table must visually align all added time zones to the *current time of the home (topmost) zone*. This means the vertical "now" indicator should show, for each zone, the local time that corresponds to the current instant in the home zone. This is not just about showing each zone's own local now, but about showing what time it is in every zone when it is "now" in the home zone. This enables users to see, for example, if it is 12:00 in Sri Lanka, what time it is in New York, Tokyo, etc., all aligned to the home zone's current time.

## Core Requirements
- **Every zone row** must highlight the cell that matches the local time equivalent to the home zone's current time (not just each zone's own now).
- **The 'now' indicator** is a vertical line or highlight that runs through the table, aligning all zones to the home zone's current time.
- **The topmost country (reference zone)** is the anchor; all other zones show the equivalent local time for that instant.
- **Reference hour highlighting** (when clicking a cell in the top row) still works for cross-zone comparison.
- **Do not remove or break the data changer section.**
- **Keep all meeting/period/color logic intact.**

## Implementation Plan

### 1. Compute Home Zone's Current Time
- Get the current time in the home zone (e.g., `const homeNow = moment.tz(Date.now(), homeZone.iana)`).

### 2. For Each Zone, Convert the Home Zone's Now to Local Time
- For each added zone:
  - Convert the home zone's current instant to the zone's local time: `const local = homeNow.clone().tz(zone.iana)`.
  - Store the local hour for each zone in a map: `{ zoneId: local.hour() }`.

### 3. Render the 'Now' Indicator for Each Row
- In the table render, for each zone row, highlight the cell where `cell.hour === localHourMap[zone.id]`.
- This ensures all zones are visually aligned to the home zone's current time.

### 4. Reference Hour Highlighting
- When a user clicks a cell in the top row, use the reference hour alignment logic as before (convert the selected hour in the home zone to each target zone and highlight the corresponding cell).

### 5. UI/UX
- Style the 'now' indicator distinctly (e.g., a vertical bar, glowing background, or border).
- Ensure this does not interfere with data changer, meeting, or period coloring features.
- The top row (reference zone) should show both the reference highlight and the 'now' indicator if they overlap.

### 6. Example Algorithm
```tsx
const homeZone = zones[0]; // or zones.find(z => z.isHome)
const homeNow = moment.tz(Date.now(), homeZone.iana);
const localHourMap = {};
zones.forEach(zone => {
  const local = homeNow.clone().tz(zone.iana);
  localHourMap[zone.id] = local.hour();
});
// In cell render:
const isNow = localHourMap[zone.id] === hourIndex;
```

### 7. Summary Table
| Feature                | Description                                        |
|------------------------|----------------------------------------------------|
| Reference Highlight    | Shows equivalent hour for selected reference hour   |
| 'Now' Indicator        | Aligns all zones to home zone's current time        |
| Period Coloring        | Color cells by morning/afternoon/evening/night     |
| Data Changer           | Remains untouched                                  |
| Meeting/Other Features | Remain untouched                                   |

---

## Next Steps
1. Add a `localHourMap` that aligns all zones to the home zone's current time.
2. In the table, render a 'now' indicator in each row at the correct cell.
3. Style the 'now' indicator distinctly from reference highlights.
4. Test with multiple zones and edge cases.

---

**This document is a living reference for true time alignment in your world time table.**
