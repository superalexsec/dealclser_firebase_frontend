# Checklist: Restrict Message Flow Editing

- [x] 1. **Understand the Goal:** The main objective is to prevent users from editing message flows for any modules except "welcome" and "goodbye" on the "Message Flow" page.

- [x] 2. **Explore the Codebase:**
    - [x] Locate the `MessageFlow.tsx` page component.
    - [x] Analyze how it fetches and displays the list of modules (e.g., in a dropdown).
    - [x] Identify how the module data is structured. Specifically, find the property that holds the module name (e.g., `module.name`).
    - [x] Examine the existing UI components for adding, editing, and deleting messages to understand how to disable them.

- [x] 3. **Implement the Restriction Logic:**
    - [x] In `MessageFlow.tsx`, after fetching the list of modules, identify the currently selected module.
    - [x] Create a condition to check if the selected module's name is either "welcome" or "goodbye".
    - [x] Use this condition to conditionally render or disable the UI controls for editing the message flow (e.g., "Add Message," "Edit," "Delete," and drag-and-drop functionality).
    - [x] Display a message to the user explaining why editing is disabled for the selected module (e.g., "Editing is only allowed for 'welcome' and 'goodbye' modules.").

- [x] 4. **Testing (Mental Walkthrough):**
    - [x] Imagine selecting the "welcome" module. The editing controls should be visible and active.
    - [x] Imagine selecting the "goodbye" module. The editing controls should be visible and active.
    - [x] Imagine selecting any other module (e.g., "client_check"). The editing controls should be disabled or hidden, and the informational message should be displayed.

- [x] 5. **Final Review:**
    - [x] Ensure no existing functionality for the "welcome" and "goodbye" modules is broken.
    - [x] Confirm that the code changes are isolated to the `MessageFlow.tsx` component as much as possible to avoid unintended side effects.
