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

Subject: Backend reCAPTCHA Implementation & Frontend Integration Guide

Hi Frontend Team,

We have implemented Google Cloud reCAPTCHA Enterprise (Free Tier) on the backend to protect sensitive endpoints. Please implement the client-side integration using the details below.

### 1. Configuration
- **Site Key**: `6LcPkjAsAAAAAElRZLBofF_bbHjBIs0bUX78Pt6K`
- **Allowed Domains**: `proximonegocio.com.br`

### 2. Request Contract
For every protected endpoint, you must generate a reCAPTCHA token using the specific **action name** and include two custom headers in your API request:

*   `X-Recaptcha-Token`: The token string received from Google.
*   `X-Recaptcha-Action`: The action name used to generate the token.

### 3. Protected Endpoints & Actions

| Endpoint | Method | Expected Action Name |
| :--- | :--- | :--- |
| `/register` (Signup) | `POST` | `signup` |
| `/token` (Login) | `POST` | `login` |
| `/auth/forgot-password` | `POST` | `password_reset` |
| `/auth/request-mfa` | `POST` | `resend_otp` |

**Important**: The backend verifies that the action in the token matches the expected action for the endpoint. Mismatches will be rejected.

### 4. Error Handling
If verification fails, the backend will return a 4xx error. Please handle these in the UI (e.g., show a toast or form error).

*   **400 Bad Request**: Missing headers.
*   **403 Forbidden**: Invalid/Expired token or Action Mismatch.

### Example Integration (Conceptual)

```javascript
// Example using Google's reCAPTCHA Enterprise library
const token = await grecaptcha.enterprise.execute('6LcPkjAsAAAAAElRZLBofF_bbHjBIs0bUX78Pt6K', {action: 'login'});

const response = await fetch('https://[backend_URL]/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Recaptcha-Token': token,
    'X-Recaptcha-Action': 'login'
  },
  body: JSON.stringify({ ...credentials })
});
```

Let us know if you have any questions!

Best,
Backend Team

