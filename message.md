Subject: Query re: Response Structure for GET /contract-api/contracts/{id}/public-details

Hi Tenant Team,

Thanks for the update that the `/contract-api/contracts/{id}/public-details` endpoint is now working. We successfully fetched a response for a specific contract:

Curl command used:
`curl --location 'https://tenant-app-backend-804135020956.us-central1.run.app/contract-api/contracts/0fd4b486-f774-487d-a8c3-f4d2cb2400d0/public-details'`

Observed JSON Response:
```json
{
  "contract_db_id": "0fd4b486-f774-487d-a8c3-f4d2cb2400d0",
  "pdf_download_url": "https://storage.googleapis.com/...", 
  "client_id": "ed524fd8-439d-4b24-9f47-911704630584",
  "client_phone_number": "551196660..." 
}
```

This response provides the essential `pdf_download_url`. However, we noticed that the `status` and `signed_at` fields, which were mentioned in your previous communication as part of `schemas.PublicContractDetails`, were not present in this successful response. The `content` (HTML) field was also missing.

On the frontend, particularly on the `PublicContractSigningPage.tsx`, we rely on:

1.  **`status`**: To determine if a contract is already signed or awaiting signature. This is critical for:
    *   Enabling/disabling the "Sign" button.
    *   Displaying appropriate messages to the client (e.g., "This contract is already signed").
    *   Preventing attempts to re-sign an already signed contract.
2.  **`signed_at`**: To display the date/time when the contract was signed, if applicable.
3.  **`content`**: We had a fallback to display HTML content if the PDF URL wasn't available or for other supplementary purposes. If this is no longer provided, we can simplify the UI to only focus on the PDF.

**Our Questions:**

1.  Should the `GET /contract-api/contracts/{contract_db_id}/public-details` endpoint **always** include the `status` (e.g., "awaiting_signature", "signed") and `signed_at` (null if not signed) fields in its response for any valid contract ID?
    *   If not, how should the frontend reliably determine the current status of the contract (especially whether it's already signed) when a client views this public page?
2.  What is the intended ongoing role of the `content` (HTML) field in this response? Will it be populated under certain conditions, or should we assume the `pdf_download_url` is now the sole method for viewing contract details on this page?

Clarity on these points will help us finalize the frontend logic for the public signing page and ensure it behaves correctly based on the contract's actual state.

We've currently updated our `PublicContractDetails` TypeScript interface to mark these fields as optional to match the observed response, but we're holding off on changing the core logic on the signing page until we have this clarification.

Thanks,
Frontend Team
