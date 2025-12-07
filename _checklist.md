# Checklist: Fix Calendar Timezone Issues

This checklist outlines the steps to resolve timezone inconsistencies on the Calendar page.

- [x] **1. Analyze Current Implementation**
  - [x] Review `src/pages/Calendar.tsx` to understand the usage of `react-big-calendar` and `date-fns`.
  - [x] Inspect API calls related to calendar events in `src/lib/api.ts` and `Calendar.tsx`.
  - [x] Check the data structure for events, specifically how `start` and `end` times are stored and handled.

- [x] **2. Identify the Root Cause**
  - [x] **Display:** Dates from the backend are parsed with `new Date()`. While this converts UTC strings to local `Date` objects, the `date-fns` localizer for `react-big-calendar` isn't fully timezone-aware, which can be problematic.
  - [x] **Creation:** The logic to convert local time to UTC for new appointments is implemented with a manual and unreliable timezone offset calculation (`startDate.valueOf() - startDate.getTimezoneOffset() * 60000`). This is the primary bug.

- [x] **3. Implement the Fix**
  - [x] **Dependency:** No new dependency needed. `date-fns` is sufficient.
  - [x] **Event Creation:** In `src/pages/Calendar.tsx`, refactored the `handleSaveAppointment` function. Replaced the manual UTC conversion with the standard `toISOString()` method.
  - [x] **Event Display:** In `src/pages/Calendar.tsx`, modified the `useQuery` for fetching appointments. Used `parseISO` from `date-fns` to reliably parse incoming UTC `start_time` and `end_time` strings into correct local `Date` objects for display.

- [ ] **4. Verification**
  - [ ] Manually test the calendar by creating an event at a specific time (e.g., 2:00 PM).
  - [ ] Verify in the backend or via network tools that the time was sent as the correct UTC equivalent.
  - [ ] Change the local timezone of your system/browser.
  - [ ] Refresh the calendar page and verify that the event's displayed time has shifted correctly according to the new timezone (e.g., it no longer shows 2:00 PM but the equivalent in the new zone).

- [ ] **5. Documentation**
  - [ ] No new dependencies were added, so no changes are needed for `package.json` or `README.md`.
