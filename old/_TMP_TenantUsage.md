## Contract Service Integration (`/contract-api`)

Endpoints for managing contract templates and handling contract generation/signing by proxying requests to the internal Contract Service.

### Contract Templates

*   **`GET /contract-api/template/`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Retrieves the current contract template content for the authenticated tenant from the Contract Service.
    *   **Response:** `schemas.ContractTemplateRead`

*   **`PUT /contract-api/template/`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Updates the contract template content for the authenticated tenant in the Contract Service.
    *   **Request Body:** `schemas.ContractTemplateUpdate`
    *   **Response:** `schemas.ContractTemplateRead` (updated template)

*   **`POST /contract-api/template/`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Creates a new contract template for the authenticated tenant in the Contract Service.
    *   **Request Body:** `schemas.ContractTemplateCreate`
    *   **Response:** `schemas.ContractTemplateRead` (created template, 201 Created)

### Contract Generation & Signing

*   **`POST /contract-api/trigger-generation`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Triggers the Contract Service to generate a contract PDF for a given client phone number. Stores the returned `contract_service_id` and `public_url` (signing link for the client) in the Tenant Service database.
    *   **Request Body:** `schemas.TriggerContractRequest` (`{"client_phone_number": "..."}`)
    *   **Response:** `schemas.TriggerContractServiceResponse` (includes `message`, `contract_service_id`, `public_url`, `tenant_service_db_id`, 201 Created)

*   **`POST /contract-api/sign/{contract_service_id}`**
    *   **Auth:** None directly (intended to be called by the client's browser visiting the `public_url`). The `contract_db_id` (renamed from `contract_service_id`) in the path is used to look up the tenant and contract details.
    *   **Action:** Forwards the signing request (including client phone and optional device info) to the Contract Service for the specific contract. Updates the contract status to `SIGNED` in the Tenant Service database upon success.
    *   **Path Parameter:** `contract_db_id` (UUID of the contract record in the Tenant Service DB).
    *   **Request Body:** `schemas.SignContractTenantRequest`
    *   **Response:** `schemas.SignContractResponse` (proxied from Contract Service)

*   **`GET /contract-api/contracts/`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Retrieves a list of contracts generated for the authenticated tenant's clients. Supports pagination.
    *   **Query Parameters:**
        *   `skip` (int, optional, default: 0): Number of records to skip.
        *   `limit` (int, optional, default: 100): Maximum number of records to return.
    *   **Response:** `List[schemas.ClientContractListItem]`

*   **`GET /contract-api/contracts/{contract_db_id}/public-details`**
    *   **Auth:** None (publicly accessible via the contract's unique ID).
    *   **Action:** Fetches details required to display a specific contract for public signing. This includes a temporary, secure download URL for the contract PDF (obtained from the Contract Service).
    *   **Path Parameter:** `contract_db_id` (UUID of the contract record in the Tenant Service DB).
    *   **Response:** `schemas.PublicContractDetails` (includes `pdf_download_url`, client details, status, etc.)

*Note: Endpoint for listing generated contracts is pending discussion and implementation by the Contract Service team.*

## Calendar Service Integration (`/api/v1/calendar`)

Endpoints for managing tenant calendar settings, availability, and appointments by proxying requests to the internal Calendar Service.

### Calendar Settings

*   **`POST /api/v1/calendar/settings`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Allows tenants to define or modify their core calendar configurations (calendar name, working periods, etc.).
    *   **Request Body:** `schemas.FrontendTenantCalendarSettingsCreate` (as defined in frontend `api.ts`, corresponds to backend schema)
        ```json
        {
          "calendar_name": "My Clinic Schedule",
          "max_concurrent_events": 3,
          "timezone": "America/New_York",
          "appointment_duration_minutes": 45,
          "working_periods": [
            { "day_of_week": 1, "start_time": "09:00:00", "end_time": "17:00:00", "is_active": true }
          ]
        }
        ```
    *   **Response:** `schemas.TenantCalendarSettingsResponse` (backend, frontend uses `TenantCalendarSettingsPostResponse` which is `{ "calendar_id": "<calendar_service_uuid>" }`)

*   **`GET /api/v1/calendar/settings`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Retrieves the authenticated tenant's comprehensive calendar settings.
    *   **Response:** `schemas.TenantCalendarInfo` (as defined in frontend `api.ts`, corresponds to backend schema)
        ```json
        {
          "calendar_id": "<calendar_service_uuid>",
          "tenant_id": "<tenant_app_uuid>",
          "calendar_name": "My Clinic Schedule",
          "max_concurrent_events": 3,
          "timezone": "America/New_York",
          "appointment_duration_minutes": 45,
          "working_periods": [
            { "id": "<wp_uuid>", "day_of_week": 1, "start_time": "09:00:00", "end_time": "17:00:00", "is_active": true }
          ]
        }
        ```

### Availability

*   **`POST /api/v1/calendar/availability/check`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Checks if a specific date/time slot is available for booking.
    *   **Request Body:** `schemas.CheckSlotAvailabilityRequestFrontend` (as defined in frontend `api.ts`)
        ```json
        {
          "start_datetime": "2024-09-15T10:00:00",
          "duration_minutes": 45
        }
        ```
    *   **Response:** `schemas.SlotAvailabilityResponse` (as defined in frontend `api.ts`)
        ```json
        {
          "is_available": true,
          "requested_start_datetime": "2024-09-15T10:00:00",
          "requested_end_datetime": "2024-09-15T10:45:00",
          "message": "Slot is available."
        }
        ```

### Appointments

*   **`POST /api/v1/calendar/appointments`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Books a new appointment for one of the tenant's clients.
    *   **Request Body:** `schemas.AppointmentCreateFrontend` (as defined in frontend `api.ts`)
        ```json
        {
          "client_phone_number": "+15551234567",
          "start_time": "2024-09-15T10:00:00Z",
          "end_time": "2024-09-15T10:45:00Z",
          "description": "Follow-up consultation"
        }
        ```
    *   **Response:** `schemas.AppointmentResponse` (as defined in frontend `api.ts`)

*   **`GET /api/v1/calendar/appointments/{appointment_id}`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Retrieves the details of a specific appointment.
    *   **Path Parameter:** `appointment_id` (string, UUID format)
    *   **Response:** `schemas.AppointmentResponse`

*   **`DELETE /api/v1/calendar/appointments/{appointment_id}`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Cancels an existing appointment.
    *   **Path Parameter:** `appointment_id` (string, UUID format)
    *   **Response:** `schemas.AppointmentCancelResponse` (frontend uses ` { "status": "cancelled" }`)

*   **`GET /api/v1/calendar/appointments`**
    *   **Auth:** Tenant JWT required.
    *   **Action:** Fetches a list of all appointments for the authenticated tenant within a given date range.
    *   **Query Parameters:**
        *   `start_date` (string, YYYY-MM-DD, required)
        *   `end_date` (string, YYYY-MM-DD, required)
    *   **Response:** `List[schemas.AppointmentResponse]` 