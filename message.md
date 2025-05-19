Subject: URGENT: 404 Error on Contract Signing Endpoint - Incorrect URL

Hi Frontend Team,

Following up on our previous message regarding the contract viewing and signing APIs, we've observed that the signing attempts are currently failing with a 404 Not Found error.

**Issue:**
The POST request to sign the contract is being made to an incorrect URL.

*   **URL currently being called by Frontend (leading to 404):**
    `POST /contracts/public/{contract_db_id}/sign`

*   **Correct Backend Endpoint URL (as documented previously):**
    `POST /contract-api/sign/{contract_db_id}`

**Action Required:**
Please update the frontend application to use the correct endpoint for the contract signing POST request:
`http://YOUR_BACKEND_API_URL/contract-api/sign/{contract_db_id}`

(Remember to replace `{contract_db_id}` with the actual contract database ID and `http://YOUR_BACKEND_API_URL` with the Tenant service's base URL.)

The backend route `POST /contract-api/sign/{contract_db_id}` is correctly defined and expects requests at this path. The current URL being used (`/contracts/public/...`) does not match any defined route for this action.

Once this URL is corrected, the signing requests should reach the backend successfully.

Please let us know if you have any questions.

Thanks,
[Your Name/Tenant Team]
