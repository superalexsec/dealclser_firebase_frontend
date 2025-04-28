# DealCloser Frontend

This is the frontend application for the DealCloser platform, built with React and TypeScript.

## Overview

This application provides the user interface for tenants to manage their WhatsApp bot interactions, including:

*   **Dashboard:** Overview of key metrics and recent activity.
*   **Messaging Flow Configuration:**
    *   **Module Flow:** Define the sequence of different interaction modules (e.g., Welcome, Verification, Scheduling).
    *   **Message Flow:** Define the specific messages within each module.
*   **Client Management:** (Placeholder for Client Service interaction)
*   **Calendar Integration:** (Placeholder for Calendar interaction)
*   **PDF Generation/Signing:** (Placeholders for PDF/Signing Service interaction)
*   **Settings & Profile:** Manage tenant and user profile information.

## Tech Stack

*   **Framework/Library:** React 18+
*   **Language:** TypeScript
*   **UI Components:** Material UI (MUI) v5
*   **Routing:** React Router v6
*   **State Management:**
    *   Server State: TanStack Query (React Query) v4/v5
    *   Client State: React Context API (for Auth)
*   **API Client:** Axios
*   **Drag & Drop:** react-beautiful-dnd
*   **Styling:** MUI (primarily)

## Setup and Running Locally

1.  **Prerequisites:** Node.js (v18+) and npm/yarn.
2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Configuration:**
    *   **Backend URL:** The application expects the backend API URL to be available globally via `window.runtimeConfig.backendUrl`. This is typically injected at runtime, for example, through a script in `public/index.html` that reads an environment variable or configuration file.
      *Example (`public/index.html` snippet):*
      ```html
      <script>
        window.runtimeConfig = {
          backendUrl: '${BACKEND_API_URL}' // Replace with actual URL injection method
        };
      </script>
      ```
    *   **Authentication Token:** The application expects the JWT authentication token to be stored in `localStorage` under the key `authToken` after a successful login. Ensure the authentication flow/context (`src/contexts/AuthContext.tsx`) implements this.
4.  **Run Development Server:**
    ```bash
    npm start
    # or
    # yarn start
    ```
    This will typically start the application on `http://localhost:3000`.

## Key Components & Structure

*   `src/`: Main source code directory.
    *   `App.tsx`: Root component, sets up providers (Theme, React Query, Auth) and routing.
    *   `components/`: Reusable UI components (e.g., `Layout.tsx`).
    *   `contexts/`: React Context providers (e.g., `AuthContext.tsx`).
    *   `hooks/`: Custom React hooks.
    *   `lib/`: Utility functions and libraries (e.g., `api.ts` for Axios configuration).
    *   `pages/`: Top-level components representing application pages/routes (e.g., `Dashboard.tsx`, `ModuleFlow.tsx`).
    *   `theme/`: MUI theme configuration.
*   `public/`: Static assets and the main `index.html` file.

## API Interaction

*   All backend communication is handled via the configured Axios instance in `src/lib/api.ts`.
*   This instance automatically retrieves the `backendUrl` from `window.runtimeConfig` and adds the `Authorization: Bearer <token>` header using the token stored in `localStorage`.
*   Server state (fetching, caching, updates) is managed using TanStack Query (`useQuery`, `useMutation`).

## Available Scripts

*   `npm start` / `yarn start`: Runs the app in development mode.
*   `npm run build` / `yarn build`: Builds the app for production to the `build` folder.
*   `npm test` / `yarn test`: Launches the test runner (if configured).
*   `npm run eject` / `yarn eject`: (If using Create React App) Exposes the underlying configuration.

## Deployment

This application is designed to be built into static assets (`npm run build`) which can then be served by any static file server or hosting platform (like GCP Cloud Storage, Netlify, Vercel, etc.). Ensure the `window.runtimeConfig.backendUrl` is correctly injected during the deployment or container startup process.
