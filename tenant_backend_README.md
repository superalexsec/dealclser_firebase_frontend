## Client Management Endpoints (Authentication Required)

These endpoints allow tenants to manage their client data. All endpoints require authentication via a Bearer token.

### Create Client

Adds a new client associated with the authenticated tenant. The `phone` number, if provided, must be unique for the tenant.

*   **Endpoint:** `POST /clients`
*   **Request Body:** `schemas.ClientCreate` (JSON)
*   **Response Body (Success):** `schemas.Client` (JSON) with status `201 Created`
*   **Response Body (Error):** `400 Bad Request` if validation fails (e.g., duplicate phone number).

```bash
curl -X POST "$URL/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "cpf_cnpj": "12345678901",
        "name": "New Client Name",
        "address": "123 Client St",
        "city": "Client City",
        "state": "CS",
        "country": "Brasil",
        "phone": "+5511999998888",
        "email": "client.new@example.com"
      }' | cat
```

**Example Success Response (201 Created):**
```json
{
  "cpf_cnpj": "12345678901",
  "name": "New Client Name",
  "address": "123 Client St",
  "city": "Client City",
  "state": "CS",
  "country": "Brasil",
  "phone": "+5511999998888",
  "email": "client.new@example.com",
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "tenant_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
  "created_at": "2023-10-27T10:00:00.123456+00:00",
  "updated_at": "2023-10-27T10:00:00.123456+00:00"
}
```

### Get Clients (List)

Retrieves a paginated list of clients for the authenticated tenant.

*   **Endpoint:** `GET /clients`
*   **Query Parameters:**
    *   `skip` (integer, optional, default: 0): Number of records to skip.
    *   `limit` (integer, optional, default: 100, max: 200): Maximum number of records to return.
*   **Response Body:** `List[schemas.Client]` (JSON) with status `200 OK`

```bash
# Get first 10 clients
curl -X GET "$URL/clients?limit=10" \
  -H "Authorization: Bearer $TOKEN" | cat

# Get next 10 clients (page 2)
curl -X GET "$URL/clients?skip=10&limit=10" \
  -H "Authorization: Bearer $TOKEN" | cat
```

**Example Response (200 OK):**
```json
[
  {
    "cpf_cnpj": "12345678901",
    "name": "New Client Name",
    "address": "123 Client St",
    /* ... other fields ... */
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "tenant_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "created_at": "2023-10-27T10:00:00.123456+00:00",
    "updated_at": "2023-10-27T10:00:00.123456+00:00"
  },
  {
    "cpf_cnpj": "98765432109",
    "name": "Another Client",
    /* ... other fields ... */
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    "tenant_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "created_at": "2023-10-26T09:00:00.987654+00:00",
    "updated_at": "2023-10-26T09:00:00.987654+00:00"
  }
  /* ... more clients ... */
]
```

### Get Single Client

Retrieves details for a specific client belonging to the authenticated tenant by its ID.

*   **Endpoint:** `GET /clients/{client_id}`
*   **Path Parameter:** `client_id` (UUID)
*   **Response Body (Success):** `schemas.Client` (JSON) with status `200 OK`
*   **Response Body (Error):** `404 Not Found` if client ID doesn't exist for the tenant.

```bash
# Replace {client_id} with the actual ID
export CLIENT_ID="a1b2c3d4-e5f6-7890-1234-567890abcdef"
curl -X GET "$URL/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
```

**Example Response (200 OK):** (Same structure as the create response for the specific client)

### Update Client

Updates details for a specific client belonging to the authenticated tenant.

*   **Endpoint:** `PUT /clients/{client_id}`
*   **Path Parameter:** `client_id` (UUID)
*   **Request Body:** `schemas.ClientUpdate` (JSON) - Only include fields to be updated.
*   **Response Body (Success):** `schemas.Client` (JSON) with status `200 OK` (showing updated data)
*   **Response Body (Error):** `404 Not Found` if client ID doesn't exist for the tenant, `400 Bad Request` if update causes validation error (e.g., duplicate phone).

```bash
# Replace {client_id} with the actual ID
export CLIENT_ID="a1b2c3d4-e5f6-7890-1234-567890abcdef"
curl -X PUT "$URL/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Updated Client Name",
        "email": "client.updated@example.com"
      }' | cat
```

**Example Response (200 OK):** (Shows the client data with the name and email updated)

### Delete Client

Deletes a specific client belonging to the authenticated tenant by its ID.

*   **Endpoint:** `DELETE /clients/{client_id}`
*   **Path Parameter:** `client_id` (UUID)
*   **Response (Success):** Status `204 No Content`
*   **Response (Error):** `404 Not Found` if client ID doesn't exist for the tenant.

```bash
# Replace {client_id} with the actual ID
export CLIENT_ID="a1b2c3d4-e5f6-7890-1234-567890abcdef"
curl -X DELETE "$URL/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
```