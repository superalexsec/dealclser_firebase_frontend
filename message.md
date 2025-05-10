Subject: New Payment History, Status, and MercadoPago Config Endpoints Now Available

Hi Frontend Team,

We have implemented and deployed new endpoints in the Tenant Backend to support payment history, status, and MercadoPago configuration for tenants and their clients. These endpoints proxy requests to PayServ and require standard tenant JWT authentication.

---

**1. List All Payment Sessions for a Client**

- **Endpoint:** `GET /payments/sessions?client_phone_number={PHONE}`
- **Query Parameter:** `client_phone_number` (required)
- **Auth:** Bearer JWT (tenant)
- **Sample Request:**
```bash
curl -X GET "$URL/payments/sessions?client_phone_number=5511966609208" \
  -H "Authorization: Bearer $TOKEN" | cat
```
- **Sample Response:**
```json
{
  "sessions": [
    {
      "id": "a99d62ea-f15a-4ae5-8e6f-09dc77a07dcd",
      "tenant_id": "...",
      "client_phone_number": "...",
      "total_amount": "...",
      "selected_payment_method": "...",
      "payment_link": "...",
      "payment_id_external": "...",
      "preference_id": "...",
      "current_step": "...",
      "created_at": "...",
      "updated_at": "...",
      "status": "...",
      "confirmed_at": "..."
    }
    // ... more sessions
  ]
}
```

**2. Get Details for a Specific Payment Session**

- **Endpoint:** `GET /payments/sessions/{session_id}`
- **Path Parameter:** `session_id` (required)
- **Auth:** Bearer JWT (tenant)
- **Sample Request:**
```bash
curl -X GET "$URL/payments/sessions/a99d62ea-f15a-4ae5-8e6f-09dc77a07dcd" \
  -H "Authorization: Bearer $TOKEN" | cat
```
- **Sample Response:**
```json
{
  "id": "a99d62ea-f15a-4ae5-8e6f-09dc77a07dcd",
  "tenant_id": "...",
  "client_phone_number": "...",
  "total_amount": "...",
  "selected_payment_method": "...",
  "payment_link": "...",
  "payment_id_external": "...",
  "preference_id": "...",
  "current_step": "...",
  "created_at": "...",
  "updated_at": "...",
  "status": "...",
  "confirmed_at": "..."
}
```

**3. Register Tenant MercadoPago Configuration**

- **Endpoint:** `POST /payments/mercadopago-config`
- **Auth:** Bearer JWT (tenant)
- **Sample Request:**
```bash
curl -X POST "$URL/payments/mercadopago-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "APP_USR-xxxx-xxxx-xxxx-xxx",
    "webhook_secret": "optional-secret",
    "mp_user_id": "optional-mp-user-id",
    "mp_application_id": "optional-mp-app-id",
    "mp_public_key": "APP_PUB-xxxx-xxxx-xxxx-xxx"
  }' | cat
```
- **Sample Response:**
```json
{
  "tenant_id": "44921cd3-2158-4dde-9551-084f020f3ee4",
  "access_token": "APP_USR-xxxx-xxxx-xxxx-xxx",
  "webhook_secret": "optional-secret",
  "mp_user_id": "optional-mp-user-id",
  "mp_application_id": "optional-mp-app-id",
  "mp_public_key": "APP_PUB-xxxx-xxxx-xxxx-xxx"
}
```

**4. Update Tenant MercadoPago Configuration**

- **Endpoint:** `PATCH /payments/mercadopago-config`
- **Auth:** Bearer JWT (tenant)
- **Sample Request:**
```bash
curl -X PATCH "$URL/payments/mercadopago-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "NEW_APP_USR-xxxx-xxxx-xxxx-xxx",
    "mp_public_key": "NEW_APP_PUB-xxxx-xxxx-xxxx-xxx"
  }' | cat
```
- **Sample Response:**
```json
{
  "tenant_id": "44921cd3-2158-4dde-9551-084f020f3ee4",
  "access_token": "NEW_APP_USR-xxxx-xxxx-xxxx-xxx",
  "webhook_secret": "optional-secret",
  "mp_user_id": "optional-mp-user-id",
  "mp_application_id": "optional-mp-app-id",
  "mp_public_key": "NEW_APP_PUB-xxxx-xxxx-xxxx-xxx"
}
```

The response format matches the PayServ API and includes all relevant fields (status, dates, amounts, config, etc.).

If you need additional fields, filtering, or have any questions, please let us know!

Best regards,

Tenant Backend Team
