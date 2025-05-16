Subject: New Calendar Feature API Endpoints Ready for Frontend Integration

Hi Frontend Team,

We've successfully integrated the new Calendar Service into the Tenant App Backend. Tenants can now manage their calendar settings, check availability, and handle appointments.

The following API endpoints are available under the base path `/api/v1/calendar` and require tenant JWT authentication for all requests:

## Calendar Feature Endpoints

### 1. Manage Calendar Settings

*   **Create or Update Tenant Calendar Settings:**
    *   **Endpoint:** `POST /api/v1/calendar/settings`
    *   **Action:** Allows tenants to define or modify their core calendar configurations, such as calendar name and working periods. Other settings like timezone, maximum concurrent events, and default appointment duration are managed by the Calendar Service and can be viewed via the GET endpoint below.
    *   **Request Body (`schemas.FrontendTenantCalendarSettingsCreate`):
        ```json
        {
          "calendar_name": "My Clinic Schedule", // Required
          "max_concurrent_events": 3, // Optional, example
          "timezone": "America/New_York", // Optional, example
          "appointment_duration_minutes": 45, // Optional, example
          "working_periods": [ // Optional; if provided, replaces all existing periods
            { "day_of_week": 1, "start_time": "09:00:00", "end_time": "17:00:00", "is_active": true },
            { "day_of_week": 2, "start_time": "10:00:00", "end_time": "16:00:00", "is_active": true }
            // day_of_week: 0 (Sunday) to 6 (Saturday)
          ]
        }
        ```
    *   **Response (`schemas.TenantCalendarSettingsResponse`):** Includes the `calendar_id` from the Calendar Service.
        ```json
        {
          "calendar_id": "<calendar_service_uuid>"
        }
        ```

*   **Get Tenant Calendar Information:**
    *   **Endpoint:** `GET /api/v1/calendar/settings`
    *   **Action:** Retrieves the authenticated tenant's comprehensive calendar settings, including working periods, timezone, max concurrent events, and appointment duration as configured in the Calendar Service.
    *   **Response (`schemas.TenantCalendarInfo`):
        ```json
        {
          "calendar_id": "<calendar_service_uuid>",
          "tenant_id": "<tenant_app_uuid>",
          "max_concurrent_events": 3,
          "timezone": "America/New_York",
          "appointment_duration_minutes": 45,
          "working_periods": [
            {
              "id": "<working_period_uuid>",
              "day_of_week": 1,
              "start_time": "09:00:00",
              "end_time": "17:00:00",
              "is_active": true
            }
            // ... more working periods
          ]
        }
        ```

### 2. Check Availability

*   **Check Specific Slot Availability:**
    *   **Endpoint:** `POST /api/v1/calendar/availability/check`
    *   **Action:** Checks if a specific date/time slot is available for booking, considering the tenant's working hours, configured appointment duration (from calendar settings), existing appointments, and concurrency limits.
    *   **Request Body (`schemas.CheckSlotAvailabilityRequestFrontend`):
        ```json
        {
          "start_datetime": "2024-09-15T10:00:00", // Naive datetime string
          "duration_minutes": 45 // Must match tenant's configured appointment_duration_minutes
        }
        ```
    *   **Response (`schemas.SlotAvailabilityResponse`):
        ```json
        {
          "is_available": true, // or false
          "requested_start_datetime": "2024-09-15T10:00:00",
          "requested_end_datetime": "2024-09-15T10:45:00",
          "message": "Slot is available." // or reason for unavailability
        }
        ```

### 3. Manage Appointments

*   **Create Appointment:**
    *   **Endpoint:** `POST /api/v1/calendar/appointments`
    *   **Action:** Books a new appointment for one of the tenant's clients.
    *   **Request Body (`schemas.AppointmentCreateFrontend`):
        ```json
        {
          "client_phone_number": "+15551234567", // Phone number of an existing client of the tenant
          "start_time": "2024-09-15T10:00:00Z", // UTC or timezone-aware datetime string
          "end_time": "2024-09-15T10:45:00Z",   // Must be start_time + tenant's appointment_duration_minutes
          "description": "Follow-up consultation" // Optional
        }
        ```
    *   **Response (`schemas.AppointmentResponse`):
        ```json
        {
          "appointment_id": "<appointment_uuid>",
          "status": "confirmed",
          "tenant_id": "<tenant_app_uuid>",
          "start_time": "2024-09-15T10:00:00Z",
          "end_time": "2024-09-15T10:45:00Z",
          "description": "Follow-up consultation",
          "client_name": "Client Name", // Fetched by Calendar Service
          "client_phone_number": "+15551234567",
          "client_address": "Client Address", // Optional, fetched by Calendar Service
          "calendar_event_id": "<calendar_service_event_id>"
        }
        ```

*   **Get Appointment Details:**
    *   **Endpoint:** `GET /api/v1/calendar/appointments/{appointment_id}`
    *   **Action:** Retrieves the details of a specific appointment. The tenant must own the appointment.
    *   **Path Parameter:** `appointment_id` (string, UUID format)
    *   **Response (`schemas.AppointmentResponse`):** Same as create response.

*   **Cancel Appointment:**
    *   **Endpoint:** `DELETE /api/v1/calendar/appointments/{appointment_id}`
    *   **Action:** Cancels an existing appointment. The tenant must own the appointment.
    *   **Path Parameter:** `appointment_id` (string, UUID format)
    *   **Response (`schemas.AppointmentCancelResponse`):
        ```json
        {
          "status": "cancelled"
        }
        ```

*   **List Tenant Appointments for Date Range:**
    *   **Endpoint:** `GET /api/v1/calendar/appointments`
    *   **Action:** Fetches a list of all appointments for the authenticated tenant within a given date range (inclusive).
    *   **Query Parameters:**
        *   `start_date` (string, YYYY-MM-DD, required)
        *   `end_date` (string, YYYY-MM-DD, required)
    *   **Response:** `List[schemas.AppointmentResponse]` (Array of appointment objects, same structure as create/get response).

Please refer to the API documentation (Swagger UI at `/docs` on the backend) for detailed schema information and to try out the endpoints.

Let us know if you have any questions or need further clarification.

Best regards,

Tenant App Backend Team
