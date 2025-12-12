# ZapCentral Frontend

This is the frontend application for the ZapCentral tenant platform, built with React and TypeScript.

## Overview

This application provides the user interface for tenants to manage their WhatsApp bot interactions, including:

*   **Dashboard:** Overview of key metrics and recent activity.
*   **Messaging Flow Configuration:**
    *   **Module Flow:** Define the sequence of different interaction modules (e.g., Welcome, Verification, Scheduling). Allows reordering and activating/deactivating modules.
    *   **Message Flow:** Define the specific messages within each module. Allows adding, editing, deleting, and reordering message steps.
*   **Client Management:** View, add, edit, and delete client records.
*   **Product Catalog:** Manage product categories and individual products (name, description, price, active status).
*   **Cart Management:** View and manually add items to specific client carts.
*   **Calendar & Scheduling:** 
    *   View appointments on a monthly, weekly, or daily calendar.
    *   Add new appointments for clients, including client search and slot availability checks.
    *   View details of existing appointments.
    *   Configure calendar settings (name, working hours, default appointment duration) via the Settings page.
    *   **Settings & Profile:** Manage tenant account details, API configurations (WhatsApp Business, Mercado Pago, Calendar), user profile information, and configure a custom registration question for clients.
    *   **Security:** Multi-Factor Authentication (MFA) for **all** profile updates and mandatory email verification upon registration.
    *   **(Placeholders):** PDF Generation/Signing.

## Tech Stack

*   **Framework/Library:** React 18+
*   **Language:** TypeScript
*   **UI Components:** Material UI (MUI) v5
*   **Routing:** React Router v6
*   **State Management:**
    *   Server State: TanStack Query (React Query) v5
    *   Client State: React Context API (for Auth)
*   **API Client:** Axios
*   **Calendar Display:** React Big Calendar
*   **Date Utilities:** date-fns
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
    *   **Backend URL:** The application requires the backend API URL to be configured via an environment variable named `REACT_APP_BACKEND_URL`. Create a `.env` file in the project root (copy from `.env.example`) and set the variable:
        ```dotenv
        # .env
        REACT_APP_BACKEND_URL=https://your-backend-service-url.run.app
        ```
        This variable is embedded into the application during the build process (`npm run build`). **Do not commit your `.env` file to version control.**
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
    *   `components/`: Reusable UI components (e.g., `Layout.tsx`, `ProductDetailModal.tsx`, `AddProductDialog.tsx`).
    *   `contexts/`: React Context providers (e.g., `AuthContext.tsx`).
    *   `hooks/`: Custom React hooks.
    *   `lib/`: Utility functions and libraries (e.g., `api.ts` for Axios configuration and type definitions).
    *   `pages/`: Top-level components representing application pages/routes.
        *   **Auth Pages:** `Register.tsx`, `EmailVerification.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`.
        *   **Dashboard & Features:** `Dashboard.tsx`, `ModuleFlow.tsx`, `MessageFlow.tsx`, `ProductsCatalogPage.tsx`, `CartPage.tsx`, `ClientService.tsx`, `Settings.tsx`, `Profile.tsx`.
    *   `theme/`: MUI theme configuration.
*   `public/`: Static assets and the main `index.html` file.

## API Interaction

*   All backend communication is handled via the configured Axios instance in `src/lib/api.ts`.
*   The Axios instance reads the `baseURL` from the `REACT_APP_BACKEND_URL` environment variable at build time.
*   A request interceptor automatically adds the `Authorization: Bearer <token>` header using the token stored in `localStorage` (key: `authToken`).
*   Server state (fetching, caching, updates) is managed using TanStack Query (`useQuery`, `useMutation`).

## Available Scripts

*   `npm start` / `yarn start`: Runs the app in development mode.
*   `npm run build` / `yarn build`: Builds the app for production to the `build` folder.
*   `npm test` / `yarn test`: Launches the test runner (if configured).
*   `npm run eject` / `yarn eject`: (If using Create React App) Exposes the underlying configuration.

## Deployment (Firebase Hosting)

This application is designed to be built into static assets (`npm run build`) and deployed using Firebase Hosting.

1.  **Install Firebase CLI:** `npm install -g firebase-tools`
2.  **Login:** `firebase login`
3.  **Initialize Firebase:** Run `firebase init hosting` in the project root.
    *   Select your Firebase project.
    *   Set the public directory to `build`.
    *   Configure as a single-page app (SPA): **Yes**.
4.  **Set Backend URL Environment Variable:** Ensure the `REACT_APP_BACKEND_URL` environment variable is set correctly in your deployment environment *before* running the build command. How you set this depends on your CI/CD provider (e.g., using secrets or environment variables in GitHub Actions, Cloud Build, etc.).
5.  **Build:** `npm run build`
6.  **Deploy:** `firebase deploy --only hosting`
