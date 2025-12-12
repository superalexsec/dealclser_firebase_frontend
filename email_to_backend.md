Subject: Requirement for OTP/MFA Enforcement on All Tenant Profile Updates

Dear Backend Service Team,

We have successfully integrated the MFA flow for sensitive account updates (Email and Password). However, we noticed that general Tenant information (such as Name, Phone Number, Address, and Person Name) can currently be updated via the `PUT /users/me` endpoint without requiring an OTP.

To ensure the highest level of security for our users, we request that you extend the OTP/MFA validation to **all** fields in the Tenant Profile update payload.

**Current Behavior:**
- `PUT /tenants/me` with `name`, `phone`, `address` -> Updates successfully **without** `otp`.
- `PUT /tenants/me` with `email`, `password` -> Requires `otp`.

**Requested Behavior:**
- Any request to `PUT /tenants/me` should require a valid `otp` field in the payload.
- If `otp` is missing or invalid for *any* update request, the API should return a `401 Unauthorized` or `403 Forbidden` error (e.g., "OTP required" or "Invalid OTP").

Once this is implemented on the backend, we will update the frontend to trigger the MFA verification dialog for every profile save action.

Best regards,

Frontend Team

