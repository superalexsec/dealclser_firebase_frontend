# Checklist: Auth & Email Verification Integration

## 1. API Library Updates (`src/lib/api.ts`)
- [x] Add `verifyEmailOtp` function (`POST /auth/verify-email-otp`).
- [x] Add `requestMfa` function (`POST /auth/request-mfa`).
- [x] Add `forgotPassword` function (`POST /auth/forgot-password`).
- [x] Add `resetPassword` function (`POST /auth/reset-password`).
- [x] Verify correct endpoints: `/register` (not `/auth/register`), `/token` (not `/auth/token`), `/tenants/me`.

## 2. Page & Component Creation
- [x] Create `src/pages/EmailVerification.tsx`.
    - [x] Input for Email (pre-fill if coming from register) and OTP.
    - [x] Handle submit -> call `verifyEmailOtp`.
    - [x] On success -> Redirect to Login (or auto-login if token provided?). *Email says redirect to Login.*
- [x] Create `src/pages/ForgotPassword.tsx`.
    - [x] Input for Email.
    - [x] Handle submit -> call `forgotPassword`.
    - [x] On success -> Navigate to Reset Password page (pass email).
- [x] Create `src/pages/ResetPassword.tsx`.
    - [x] Inputs: Email, OTP, New Password.
    - [x] Handle submit -> call `resetPassword`.
    - [x] On success -> Redirect to Login.

## 3. Routing (`src/App.tsx`)
- [x] Add route `/verify-email` -> `EmailVerification`.
- [x] Add route `/forgot-password` -> `ForgotPassword`.
- [x] Add route `/reset-password` -> `ResetPassword`.

## 4. Auth Flow Updates
- [x] **Registration (`src/pages/Register.tsx` & `src/pages/Landing.tsx`)**:
    - [x] Update success handler to redirect to `/verify-email` with email state.
    - [x] Remove auto-login logic if present (since user is not verified yet).
    - [x] Use correct endpoint `/register`.
- [x] **Login (`src/contexts/AuthContext.tsx`)**:
    - [x] In `loginWithCredentials`, catch 401 errors.
    - [x] Check if error detail contains "Email not verified".
    - [x] If yes, throw a specific error or return a status that the UI can use to redirect to `/verify-email`.
    - [x] Use correct endpoint `/token`.

## 5. Profile Update (`src/pages/Profile.tsx`)
- [x] Identify sensitive field updates (Email, Password).
- [x] Add state for MFA OTP modal.
- [x] Implement `handleSensitiveUpdate` flow:
    - [x] Call `requestMfa`.
    - [x] Open OTP Modal.
    - [x] On OTP submit -> Call `updateTenantData` with `otp`.
    - [x] Handle `403`/`400` errors for invalid OTP.
    - [x] Use correct endpoint `/tenants/me`.
- [x] **Update per Backend Requirement:** Enforce MFA for *all* profile updates (name, phone, etc.), not just sensitive ones.

## 6. Testing
- [x] Verify Registration -> Verification -> Login flow.
- [x] Verify Login (unverified) -> Redirect to Verification.
- [x] Verify Forgot Password -> Reset Password -> Login.
- [x] Verify Profile Update (Sensitive) -> MFA -> Update.
- [x] Run production build (`npm run build`).
