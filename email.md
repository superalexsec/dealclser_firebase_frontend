To: Frontend Team
Subject: Backend Update: OTP Enforcement for Tenant Deletion and Profile Updates

Hi Frontend Team,

We have updated the backend to strictly enforce OTP verification for critical actions: **Profile Updates** and **Tenant Deletion**.

### 1. Profile Updates (`PUT /tenants/me`)

As previously communicated, **ANY** update to tenant information now requires a valid `otp` field.

### 2. Tenant Deletion (`DELETE /tenants/me`) - **NEW**

We have also added OTP protection to the account deletion endpoint.

**Action Required:**
Before calling the delete endpoint, you must request an OTP via `POST /auth/request-mfa` and prompt the user to enter it.

**Request Format:**

- **Endpoint**: `DELETE /tenants/me`
- **Body** (JSON):
  ```json
  {
    "otp": "123456"
  }
  ```
  *(Note: DELETE requests with a body are supported by HTTP specs and most clients, but ensure your client library supports it. If not, let us know).*

**Error Responses:**
- `403 Forbidden`: OTP is missing.
- `400 Bad Request`: OTP is invalid or expired.

Please update your "Delete Account" flow to include this verification step.

Best regards,
Backend Service Team

