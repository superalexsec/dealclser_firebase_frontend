Subject: New `date_of_birth` field available for Clients

Hi Frontend Team,

The Tenant Backend API has been updated to support a new `date_of_birth` field for client records.

**Details:**

*   **Field Name:** `date_of_birth`
*   **Availability:**
    *   Can be included (optional) when creating a client (`POST /clients`).
    *   Can be included (optional) when updating a client (`PUT /clients/{client_id}`).
    *   Will be returned (if set) when fetching clients (`GET /clients` or `GET /clients/{client_id}`).
*   **Format:** The date should be sent as a string in `YYYY-MM-DD` format.
*   **Optional:** This field is not required.

**Example API Usage:**

**1. Creating a Client with Date of Birth:**
```http
POST /clients
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "client_phone_number": "+5511987654321",
  "first_name": "Jane",
  "surname": "Doe",
  "email": "jane.doe@example.com",
  "date_of_birth": "1995-06-15" 
  // ... other optional fields
}
```

**2. Updating a Client's Date of Birth:**
```http
PUT /clients/{client_id}
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "date_of_birth": "1995-06-15"
  // ... other fields to update
}
```

**3. Example Response when Fetching a Client:**
```json
{
  "id": "eaaec79c-af6d-456a-bd90-0466efc49c36",
  "tenant_id": "44921cd3-2158-4dde-9551-084f020f3ee4",
  "client_phone_number": "+5511987654321",
  "client_identification": null,
  "address": null,
  "city": null,
  "state": null,
  "country": null,
  "email": "jane.doe@example.com",
  "first_name": "Jane",
  "surname": "Doe",
  "date_of_birth": "1995-06-15", // <--- Field is included here if set
  "zip_code": null,
  "custom_field": null,
  "created_at": "2024-05-12T22:10:00.123Z",
  "updated_at": "2024-05-12T22:14:00.456Z"
}
```

Please update the frontend interface to allow users to input and view this new `date_of_birth` field where appropriate.

Let us know if you have any questions!

Best,
Tenant Service Team
