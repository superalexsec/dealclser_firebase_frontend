Subject: Backend API for Public Contract Viewing & Signing

Hi Frontend Team,

The backend is ready with the APIs to support the public contract viewing and signing flow. Here are the details:

**Scenario:** A client receives a link like `https://dealcloser-540f5.web.app/contracts/{TENANT_ID}/{CLIENT_ID}/{CONTRACT_DB_ID}`.

1.  **Displaying the Contract (Public Page)**
    *   The frontend should extract the `CONTRACT_DB_ID` from the URL.
    *   Then, call our backend to get the contract details and the PDF download URL.

    **Endpoint:** `GET /contract-api/contracts/{contract_db_id}/public-details`

    **Example cURL:**
    ```bash
    # Replace {contract_db_id} with the actual ID from the URL
    CONTRACT_DB_ID="c794ea0f-374c-4f53-9c65-4d0009db64da" # Example ID

    curl -X GET \
      "http://YOUR_BACKEND_API_URL/contract-api/contracts/${CONTRACT_DB_ID}/public-details" \
      -H "accept: application/json"
    ```

    **Expected Success Response (200 OK):**
    ```json
    {
      "contract_db_id": "c794ea0f-374c-4f53-9c65-4d0009db64da",
      "pdf_download_url": "https://storage.googleapis.com/CONTRACT_SERVICE_BUCKET/tenant_x/contract_y_generated.pdf?TEMP_TOKEN=...",
      "client_id": "ed524fd8-439d-4b24-9f47-911704630584",
      "client_phone_number": "+15551234567",
      "status": "generated", // or "signed"
      "signed_at": null // or "2023-10-27T10:30:00Z"
    }
    ```
    *   The frontend should use the `pdf_download_url` to display the PDF to the client.
    *   The `client_id` and `client_phone_number` from this response will be needed for the signing step.

2.  **Handling the "Li e Aceito os Termos" (Sign Contract) Action**
    *   When the client clicks the "Li e Aceito os Termos" button:
    *   The frontend needs to extract the `CONTRACT_DB_ID` from its current page context/URL.
    *   It also needs the `CLIENT_ID` and `CLIENT_PHONE_NUMBER` (obtained from the `/public-details` call or from the initial frontend URL structure if preferred, e.g., `CLIENT_ID` part of your path `.../{CLIENT_ID}/{CONTRACT_DB_ID}`).

    **Endpoint:** `POST /contract-api/sign/{contract_db_id}`

    **Example cURL:**
    ```bash
    # Replace {contract_db_id} with the actual ID
    # Replace {client_id} and {client_phone_number} with values obtained previously
    CONTRACT_DB_ID="c794ea0f-374c-4f53-9c65-4d0009db64da" # Example ID
    CLIENT_ID="ed524fd8-439d-4b24-9f47-911704630584"       # Example ID
    CLIENT_PHONE_NUMBER="+15551234567"                     # Example Phone

    curl -X POST \
      "http://YOUR_BACKEND_API_URL/contract-api/sign/${CONTRACT_DB_ID}" \
      -H "accept: application/json" \
      -H "Content-Type: application/json" \
      -d '{
        "client_id": "'"${CLIENT_ID}"'",
        "client_phone_number": "'"${CLIENT_PHONE_NUMBER}"'",
        "device_info": "UserAgent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36; IP: 192.168.1.100"
      }'
    ```

    **Request Body Schema (`schemas.SignContractTenantRequest`):**
    ```json
    {
      "client_id": "uuid",
      "client_phone_number": "string",
      "device_info": "string (optional)"
    }
    ```

    **Expected Success Response (200 OK or 201 CREATED - refer to schema `schemas.SignContractResponse`):
    ```json
    {
      "status": "signed",
      "message": "Contract signed successfully.",
      "signed_at": "2023-10-27T10:35:00Z" // Timestamp of signing
      // Potentially other fields based on Contract Service response
    }
    ```

    **Important Notes:**
    *   Replace `http://YOUR_BACKEND_API_URL` with the actual deployed URL of our Tenant service.
    *   The `{contract_db_id}` in the path parameters refers to the ID from our `contracts_generated` table.
    *   The `client_id` in the POST body for signing is crucial for verification against the record in our database.

Please let us know if you have any questions or need further clarification.

Thanks,
[Your Name/Tenant Team]
