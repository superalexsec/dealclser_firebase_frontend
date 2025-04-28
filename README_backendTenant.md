# Tenant App Backend

This is a FastAPI backend application for a multi-tenant SaaS platform.

## Features

*   Tenant registration (`/register`)
*   Tenant login (`/token`) with JWT authentication (using tenant-specific secrets)
*   Basic database models (Tenant, Client, TenantJWTSecret) using SQLAlchemy (async)
*   Pydantic schemas for data validation
*   Docker containerization with multi-stage builds
*   Automated build and deployment via GCP Cloud Build (`cloudbuild.yaml`)

## Setup

1.  **Prerequisites:**
    *   Python 3.11+
    *   Docker (for local testing)
    *   `gcloud` CLI configured with access to your GCP project, Secret Manager, Artifact Registry, Cloud Build, and Cloud Run APIs.
    *   PostgreSQL database accessible (details expected via environment variables or GCP Secret Manager).
    *   **Secret Manager Secrets:** Ensure the following secrets exist in GCP Secret Manager in your project:
        *   `dealcloser_DB_USER` (containing the database username)
        *   `dealcloser_DB_PASS` (containing the database password)
    *   **Artifact Registry Repository:** Ensure an Artifact Registry repository exists (e.g., `dealcloser` in `us-central1`).
    *   **Permissions:**
        *   The **Cloud Build service account** needs the **Cloud Run Admin** role (`roles/run.admin`) and the **Service Account User** role (`roles/iam.serviceAccountUser`) to deploy to Cloud Run.
        *   The **Cloud Run runtime service account** (usually the Compute Engine default service account unless specified otherwise during deployment) needs the **Secret Manager Secret Accessor** role (`roles/secretmanager.secretAccessor`) to access the database credentials at runtime.
You can grant these roles via the GCP Console IAM page or using `gcloud` commands.

2.  **Configuration (`cloudbuild.yaml`):**
    *   Verify the substitution values at the bottom of `cloudbuild.yaml` match your environment:
        *   `_REGION`: Your desired GCP region (e.g., `us-central1`).
        *   `_PROJECT_ID`: Your GCP Project ID.
        *   `_REPOSITORY_NAME`: Your Artifact Registry repository name.
        *   `_IMAGE_NAME`: Your desired image name. This will also be used as the **Cloud Run service name** by default.

3.  **Environment Variables (Local Development):**
    *   Create a `.env` file in the root directory for local development (this file is ignored by git and not included in the Docker image):
        ```
        DB_USER=your_db_user
        DB_PASS=your_db_password
        DB_HOST=your_db_host # e.g., localhost or 34.44.255.179
        DB_PORT=5432
        DB_NAME=whatsapp_db
        # Optional JWT settings (defaults are provided in auth.py)
        # JWT_ALGORITHM=HS256
        # ACCESS_TOKEN_EXPIRE_MINUTES=30
        ```

4.  **Install Dependencies (Local Development):**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run Locally:**
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    Access the API at `http://localhost:8000` and the interactive docs at `http://localhost:8000/docs`.

6.  **Test Login (Local or Deployed):**
    Once the app is running, you can test the token endpoint (replace `YOUR_SERVICE_URL` with `http://localhost:8000` for local or the Cloud Run URL for deployed):
    ```bash
    # Replace user email and password as needed
    curl -X POST https://tenant-app-backend-804135020956.us-central1.run.app/register -H "Content-Type: application/json" -d '{"name": "Test Tenant Example", "email": "test-user@example.com", "password": "StrongPassword123!", "phone": "+15551234567", "person_name": "Test Person", "address": "123 Test St"}'
    ```

7.  **Test Registration (Local or Deployed):**
    ```bash
    # Replace with appropriate user details
    curl -X POST "https://tenant-app-backend-804135020956.us-central1.run.app/register" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "yourpassword"}' # Add other required fields as necessary
    ```

## Tenant Management Endpoints (Authentication Required)

These endpoints require a valid JWT Bearer token obtained from the `/token` endpoint.
Set the token in an environment variable for convenience:

```bash
export TOKEN="your_jwt_token_here"
export URL="your_service_url_here" # e.g., https://tenant-app-backend-....run.app
```

### Update Tenant Information

Updates the authenticated tenant's profile information.

*   **Endpoint:** `PUT /tenants/me`
*   **Request Body:** `schemas.TenantUpdate` (JSON)

```bash
curl -X PUT "$URL/tenants/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Updated Tenant Name",
        "phone": "+15551112222",
        "person_name": "Updated Person",
        "address": "456 Updated St"
      }' | cat
```

### Get WhatsApp Configuration

Retrieves the authenticated tenant's WhatsApp configuration details.

*   **Endpoint:** `GET /tenants/me/whatsapp-config`
*   **Response Body:** `schemas.WhatsappConfigurationRead` (JSON)

```bash
curl -X GET "$URL/tenants/me/whatsapp-config" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Update WhatsApp Configuration

Updates the authenticated tenant's WhatsApp configuration details. Note that a configuration record is automatically created with placeholder values during registration.

*   **Endpoint:** `PUT /tenants/me/whatsapp-config`
*   **Request Body:** `schemas.WhatsappConfigurationUpdate` (JSON)

```bash
curl -X PUT "$URL/tenants/me/whatsapp-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "phone_number_id": "your_whatsapp_phone_number_id",
        "phone_number": "+15553334444",
        "access_token": "your_whatsapp_permanent_api_token",
        "verification_token": "your_webhook_verification_token",
        "webhook_url": "https://your.webhook.receiver/endpoint",
        "is_active": true
      }' | cat
```

### Delete Tenant Account

Deletes the authenticated tenant's account and all associated data (JWT secrets, WhatsApp configuration).

*   **Endpoint:** `DELETE /tenants/me`

```bash
curl -X DELETE "$URL/tenants/me" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Logout Tenant

Logs out the current tenant by invalidating their current session. This is achieved by deleting the tenant's JWT signing secret on the server. Subsequent requests using tokens signed with the old secret will be rejected.

*   **Endpoint:** `POST /logout`

```bash
curl -X POST "$URL/logout" \
  -H "Authorization: Bearer $TOKEN" | cat
```

## Flow Management Endpoints (Authentication Required)

These endpoints allow tenants to manage their module order and message flow content.

### Get Module Order

Retrieves the ordered list of active modules for the authenticated tenant.

*   **Endpoint:** `GET /flows/modules/order`
*   **Response Body:** `List[schemas.TenantModuleOrderRead]` (JSON)

```bash
curl -X GET "$URL/flows/modules/order" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Update Module Order

Updates the order of modules for the authenticated tenant. Replaces the existing order.

*   **Endpoint:** `PUT /flows/modules/order`
*   **Request Body:** `schemas.TenantModuleOrderListUpdate` (JSON)
*   **Example:** Replace `uuid-of-module-X` with actual module IDs.

```bash
curl -X PUT "$URL/flows/modules/order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "ordered_module_ids": ["uuid-of-module-1", "uuid-of-module-2", "uuid-of-module-3"]
      }' | cat
```

### Get Message Flows for a Module

Retrieves active message flows (including steps) for a specific module.

*   **Endpoint:** `GET /flows/message-flows/module/{module_id}`
*   **Response Body:** `List[schemas.MessageFlow]` (JSON)

```bash
# Replace {module_id} with the actual ID of the module
export MODULE_ID="bc3e5561-80c7-466a-9a1d-bc67adc040c5" # Example: Welcome module
curl -X GET "$URL/flows/message-flows/module/$MODULE_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Update Message Flow Steps

Updates the steps (messages) for a specific message flow, replacing the existing steps.

*   **Endpoint:** `PUT /flows/message-flows/{flow_id}/steps`
*   **Request Body:** `schemas.MessageFlowStepsUpdate` (JSON)
*   **Example:** Update steps for the "Welcome Flow" (ID: `60eccf06-bfd3-4028-8d98-5144a1fe01b6`).

```bash
export FLOW_ID="60eccf06-bfd3-4028-8d98-5144a1fe01b6" # Example: Welcome Flow ID
curl -X PUT "$URL/flows/message-flows/$FLOW_ID/steps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "steps": [
          { "message_content": "Olá! Bem-vindo(a) ao nosso atendimento." },
          { "message_content": "Para começar, por favor informe seu CPF ou CNPJ." }
        ]
      }' | cat
```

## Deployment (Automated via Cloud Build)

Deployment is now handled automatically by the last step in `cloudbuild.yaml`.

1.  **Ensure Prerequisites and Configuration:** Double-check all prerequisites listed in the Setup section, especially the IAM permissions and `cloudbuild.yaml` substitutions.

2.  **Submit Build:**
    ```bash
    gcloud builds submit --config cloudbuild.yaml .
    ```
    Cloud Build will:
    *   Build the Docker image.
    *   Push the image to Artifact Registry.
    *   Deploy the new image version to the Cloud Run service named according to the `_IMAGE_NAME` substitution.
    *   The deployment step configures the necessary environment variables and secrets for database access.

3.  **Accessing the Service:** Once the build and deploy succeeds, find the URL for your service in the Cloud Build logs or the Cloud Run section of the GCP Console.

## TODO

*   Implement remaining API endpoints (e.g., client management, flow management).
*   Add robust error handling and logging.
*   Implement database migrations (e.g., using Alembic).
*   Write unit and integration tests.
*   Refine security measures (rate limiting, input validation, etc.).
*   Consider using a dedicated runtime service account for Cloud Run instead of the default Compute Engine service account.
*   Parameterize database host/port/name via environment variables/secrets in Cloud Run deployment step if they differ from the defaults.
