To: Frontend Team
Subject: Backend Update: OTP Enforcement for All Tenant Profile Updates

Hi Frontend Team,

We have updated the `PUT /tenants/me` endpoint to strictly enforce OTP verification for **all** tenant profile updates, as per your request.

Any attempt to update tenant information (including name, phone, address, etc.) will now require a valid `otp` field in the request body.

### Implementation Details

1.  **Request OTP**: First, call the MFA endpoint to send an OTP to the tenant's email.
    *   **Endpoint**: `POST /auth/request-mfa`
    *   **Payload**: `{"email": "tenant@example.com"}`

2.  **Update Profile**: Then, use the OTP to authorize the update.

#### **Endpoint**: `PUT /tenants/me`

**Sample Request (cURL):**

```bash
curl -X PUT "https://your-backend-url/tenants/me" \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "New Company Name",
           "phone": "+5511999999999",
           "otp": "123456"
         }'
```

**Success Response (200 OK):**

```json
{
  "id": "uuid...",
  "name": "New Company Name",
  "phone": "+5511999999999",
  "email": "tenant@example.com",
  "is_active": true,
  "created_at": "...",
  "updated_at": "...",
  "email_verified": true
}
```

**Error Response - Missing OTP (403 Forbidden):**

```json
{
  "detail": "OTP required for updating profile information."
}
```

**Error Response - Invalid OTP (400 Bad Request):**

```json
{
  "detail": "Invalid OTP."
}
```

Please update your frontend logic to trigger the MFA flow for all profile save actions.

Best regards,
Backend Service Team

