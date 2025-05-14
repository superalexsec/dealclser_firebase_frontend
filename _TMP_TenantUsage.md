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