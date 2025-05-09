# Tenant App Backend

This is a FastAPI backend application for a multi-tenant SaaS platform.

## Key Architectural Changes

*   **Tenant-Specific Data Isolation:** The application is designed for multi-tenancy. While specific mechanisms for flow templating and automatic provisioning during registration are evolving, data associated with a tenant (clients, configurations, flow orders, and potentially tenant-specific flow instances) is linked via `tenant_id`.
*   **Registration Flow:** When a new tenant registers via `/register`:
    *   A new `Tenant` record is created.
    *   A `TenantJWTSecret` is generated for secure authentication.
    *   A default `WhatsappConfiguration` is initialized.
    *   `TenantModuleOrder` records may be set up to link the tenant to available modules, allowing tenants to manage their preferred module sequence.
    *   (Note: The previous description of automatically copying template modules and flows based on a `modules.tenant_id` has been revised as the `Module` model does not currently contain a direct `tenant_id` field for such templating.)
*   **Database Constraints:**
    *   Foreign key constraints from `message_flows` (via `tenant_id`), `tenant_module_order`, `whatsapp_configurations`, `clients`, and `tenant_jwt_secrets` to `tenants` now use `ON DELETE CASCADE`. Deleting a tenant automatically removes all their directly associated data across these tables.
*   **API Endpoint Logic:** Endpoints under `/flows` enforce tenant boundaries, ensuring tenants only access and modify data linked to their `tenant_id` (e.g., their module order, or message flows that have a matching `tenant_id`).

## Features

*   Tenant registration (`/register`) with automatic setup of core tenant records, JWT secret, and default WhatsApp configuration.
*   Tenant login (`/token`) with JWT authentication (using tenant-specific secrets).
*   Tenant data management (`/tenants/me`, `/tenants/me/whatsapp-config`).
*   Tenant-specific flow management (`/flows/modules/order`, `/flows/message-flows/...`).
*   Relational database models (Tenant, Client, Module, MessageFlow, FlowStep, etc.) using SQLAlchemy (async).
*   Pydantic schemas for data validation.
*   Docker containerization with multi-stage builds.
*   Automated build and deployment via GCP Cloud Build (`cloudbuild.yaml`).

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

## Flow Management Endpoints (Authentication Required)

These endpoints allow tenants to manage their *own* module order and message flow content.

### Get Module Order

Retrieves the ordered list of *tenant-specific* active modules for the authenticated tenant.

*   **Endpoint:** `GET /flows/modules/order`
*   **Response Body:** `List[schemas.TenantModuleOrderRead]` (JSON)

```bash
curl -X GET "$URL/flows/modules/order" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Update Module Order

Updates the order of the tenant's *own* modules. Replaces the existing order. The `module_id` values must correspond to modules owned by the tenant.

*   **Endpoint:** `PUT /flows/modules/order`
*   **Request Body:** `schemas.TenantModuleOrderUpdate` (JSON)
*   **Example:** Replace `uuid-of-tenant-module-X` with actual IDs of modules copied for the tenant.

```bash
curl -X PUT "$URL/flows/modules/order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "modules": [
          { "module_id": "uuid-of-tenant-module-1", "is_active": true },
          { "module_id": "uuid-of-tenant-module-2", "is_active": false },
          { "module_id": "uuid-of-tenant-module-3", "is_active": true }
        ]
      }' | cat
```

### Get Message Flows for a Module

Retrieves active message flows (including steps) for a specific *tenant-owned* module.

*   **Endpoint:** `GET /flows/message-flows/module/{module_id}`
*   **Response Body:** `List[schemas.MessageFlow]` (JSON)

```bash
# Replace {module_id} with the actual ID of the tenant's module copy
export MODULE_ID="uuid-of-tenant-module-1" # Example: Tenant's copied Welcome module
curl -X GET "$URL/flows/message-flows/module/$MODULE_ID" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Update Message Flow Steps

Updates the steps (messages) for a specific *tenant-owned* message flow, replacing the existing steps.

*   **Endpoint:** `PUT /flows/message-flows/{flow_id}/steps`
*   **Request Body:** `schemas.MessageFlowStepsUpdate` (JSON)
*   **Example:** Update steps for the tenant's copied "Welcome Flow" (replace with the actual ID of the tenant's flow copy).

```bash
export FLOW_ID="uuid-of-tenant-flow-copy-1" # Example: Tenant's copied Welcome Flow ID
curl -X PUT "$URL/flows/message-flows/$FLOW_ID/steps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "steps": [
          { "message_content": "Olá! Bem-vindo(a) ao nosso atendimento personalizado." },
          { "message_content": "Como posso te ajudar hoje?" }
        ]
      }' | cat
```

## Products Service Interaction Endpoints (Authentication Required)

These endpoints act as an authenticated proxy to the separate Products Service. They require a tenant Bearer token and forward requests, adding the authenticated `tenant_id`.

**Note:** The `client_id` required by cart endpoints must be provided by the frontend application based on the currently interacting end-user. The `tenant_id` is added automatically by the proxy but might also be required in the request body by the Products Service for certain endpoints.

### Create Category

Creates a new product category for the authenticated tenant.

*   **Endpoint:** `POST /products-api/categories/`
*   **Request Body:** `schemas.CategoryCreate` (JSON: `{ "name": "...", "description": "..." }`)
*   **Response Body (Success):** `schemas.CategoryResponse` (JSON) with status `201 Created`

```bash
curl -L -X POST "$URL/products-api/categories/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "New Category",
        "description": "Description for the new category"
      }' | cat
```

### Get Categories

Retrieves product categories for the authenticated tenant.

*   **Endpoint:** `GET /products-api/categories/`
*   **Response Body:** `List[schemas.ProductCategory]`

```bash
curl -L -X GET "$URL/products-api/categories/" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Create Product

Creates a new product for the authenticated tenant, optionally assigning it to a category.

*   **Endpoint:** `POST /products-api/products/`
*   **Request Body:** `schemas.ProductCreate` (JSON: `{ "name": "...", "description": "...", "price": "...", "category_id": "uuid" }`) # Note: price is string, category_id required
*   **Response Body (Success):** `schemas.ProductResponse` (JSON) with status `201 Created`

```bash
# Example: Create product (category_id is always required)
export CATEGORY_ID="0e19e78d-ab85-46f1-aec5-9ceb9605cd16" # Replace with a valid category ID for the tenant
curl -L -X POST "$URL/products-api/products/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "New Product Name",
        "description": "Description for the new product",
        "price": "99.99",
        "category_id": "'$CATEGORY_ID'"
      }' | cat
```

### Update Product

Updates an existing product for the authenticated tenant. Only include fields to be updated.

*   **Endpoint:** `PUT /products-api/products/{product_id}/`
*   **Path Parameter:** `product_id` (UUID)
*   **Request Body:** `schemas.ProductUpdate` (JSON: `{ "name": "optional", "description": "optional", "price": optional, "category_id": "optional_uuid" }`)
*   **Response Body (Success):** `schemas.ProductResponse` (JSON) showing updated data.

```bash
export PRODUCT_UUID_TO_UPDATE="c3d4e5f6-a7b8-9012-3456-7890abcdef01"
# Update only price and description
curl -L -X PUT "$URL/products-api/products/$PRODUCT_UUID_TO_UPDATE/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "price": 120.50,
        "description": "Updated product description"
      }' | cat
```

### Get Products

Retrieves products for the authenticated tenant, with optional category filtering and pagination.

*   **Endpoint:** `GET /products-api/products/`
*   **Query Parameters:**
    *   `category_id` (UUID, optional): Filter by category.
    *   `page` (integer, optional, default: 1): Page number.
*   **Response Body:** `schemas.ProductListResponse`

```bash
# Get first page of all products
curl -L -X GET "$URL/products-api/products/" \
  -H "Authorization: Bearer $TOKEN" | cat

# Get page 2 of products in category {category_uuid}
export CATEGORY_ID="a1b2c3d4-e5f6-7890-1234-567890abcdef"
curl -L -X GET "$URL/products-api/products/?category_id=$CATEGORY_ID&page=2" \
  -H "Authorization: Bearer $TOKEN" | cat
```

### Add Item to Cart

Adds an item to a specific client's cart (identified by `client_id`). The proxy automatically adds `tenant_id` to the request body sent to the Products Service.

*   **Endpoint:** `POST /products-api/cart/add`
*   **Request Body:** `schemas.CartAddItemRequest` (JSON: `{ "client_id": "...", "product_id": "...", "quantity": ... }`)
*   **Response Body:** `schemas.CartActionResponse` (JSON: `{ "success": true, "message": "Item added successfully" }`)

```bash
export CLIENT_UUID="e5f6a7b8-c9d0-1234-5678-90abcdef0123"
export PRODUCT_UUID="c3d4e5f6-a7b8-9012-3456-7890abcdef01"
curl -L -X POST "$URL/products-api/cart/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "'$CLIENT_UUID'",
        "product_id": "'$PRODUCT_UUID'",
        "quantity": 2
      }' | cat
```

### Remove Item from Cart

Removes a product from a specific client's cart.

*   **Endpoint:** `POST /products-api/cart/remove`
*   **Request Body:** `schemas.CartRemoveItemRequest` (JSON: `{ "client_id": "...", "product_id": "..." }`)
*   **Response Body:** `schemas.CartActionResponse` (JSON: `{ "success": true, "message": "Item removed successfully" }`)

```bash
curl -L -X POST "$URL/products-api/cart/remove" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "'$CLIENT_UUID'",
        "product_id": "'$PRODUCT_UUID'"
      }' | cat
```

### Clear Cart

Clears all items from a specific client's cart. The proxy automatically adds `tenant_id` to the request body sent to the Products Service.

*   **Endpoint:** `POST /products-api/cart/clear`
*   **Request Body:** `schemas.CartClearRequest` (JSON: `{ "client_id": "..." }`)
*   **Response Body:** `schemas.CartActionResponse` (JSON: `{ "success": true, "message": "Cart cleared successfully" }`)

```bash
curl -L -X POST "$URL/products-api/cart/clear" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "'$CLIENT_UUID'"
      }' | cat
```

### Checkout Cart

Checks out a specific client's cart.

*   **Endpoint:** `POST /products-api/cart/checkout`
*   **Request Body:** `schemas.CartCheckoutRequest` (JSON: `{ "client_id": "..." }`)
*   **Response Body:** `schemas.CartActionResponse` (JSON: `{ "success": true, "message": "Checkout successful" }`)

```bash
curl -L -X POST "$URL/products-api/cart/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "'$CLIENT_UUID'"
      }' | cat
```

### Delete Category

Deletes a specific category belonging to the authenticated tenant by its ID.

*   **Endpoint:** `DELETE /products-api/categories/{category_id}/`
*   **Path Parameter:** `category_id` (UUID, required)
*   **Response (Success):** Status `204 No Content` (empty body)
*   **Error Responses:**
    *   `409 Conflict`: Category cannot be deleted because it is associated with one or more products. The user must reassign or delete the associated products first.
    *   `404 Not Found`: Category ID not found or does not belong to the tenant.
    *   `422 Unprocessable Entity`: Invalid category ID format.
    *   `500 Internal Server Error`: An unexpected error occurred.

```bash
# Replace {category_id} with the actual ID to delete
export CATEGORY_ID_TO_DELETE="0e19e78d-ab85-46f1-aec5-9ceb9605cd16"
curl -L -X DELETE "$URL/products-api/categories/$CATEGORY_ID_TO_DELETE/" \
  -H "Authorization: Bearer $TOKEN" | cat
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

*   Implement database migrations (e.g., using Alembic) to manage schema changes formally.
*   Refine and fully implement a robust mechanism for provisioning and customizing default/template message flows for new tenants, if required.
*   Add robust error handling and logging (especially around any flow provisioning logic).
*   Write unit and integration tests for registration and flow management.
*   Refine security measures (rate limiting, input validation, etc.).
*   Consider using a dedicated runtime service account for Cloud Run.
*   Parameterize DB connection details more securely in Cloud Run (beyond environment variables).
*   Update Pydantic response schemas (`schemas.Tenant`, `schemas.TenantModuleOrderRead`) if needed to reflect newly included relationships (like `module_orders` in the Tenant response).
*   Add API endpoints for creating/updating/deleting individual tenant-specific modules and flows if required.
*   Implement a cleanup strategy for any orphaned template data if necessary.
