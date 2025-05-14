# Contract Management Feature - Integration Testing Checklist

**Last Updated:** $(date +%Y-%m-%d)

**Objective:** Verify the end-to-end functionality of the contract management features, including template management by tenants, contract listing for tenants, and the public contract viewing/signing process for clients.

**Prerequisites:**

*   [ ] Backend service (Tenant Service / Contract Service proxy) is deployed with all new `/contract-api/*` endpoints implemented as per `message.md` specifications.
*   [ ] Frontend application is built and deployed with the latest changes.
*   [ ] At least one test tenant account is available.
*   [ ] Method to trigger contract generation for a client (this might be an existing part of the workflow or a manual step for testing).

---

## I. Tenant-Facing Features (Requires Tenant Login)

### A. Contract Template Management (`/contracts/templates`)

*   **Scenario 1: No Existing Template**
    *   [ ] **Step 1.1:** Log in as a tenant who does *not* have a contract template.
    *   [ ] **Step 1.2:** Navigate to "Contracts" > "Templates".
    *   [ ] **Verification 1.2.1:** The page loads correctly.
    *   [ ] **Verification 1.2.2:** An informational message (e.g., "No template found. Saving will create a new one.") is displayed.
    *   [ ] **Verification 1.2.3:** The "Template Name" field is pre-filled with a default name (e.g., "My Contract Template").
    *   [ ] **Verification 1.2.4:** The "Template HTML Content" field has default placeholder content (e.g., "<p>Enter your contract HTML here.</p>").
    *   [ ] **Verification 1.2.5:** The save button is labeled "Create Template".
    *   [ ] **Step 1.3:** Modify the "Template Name" (e.g., "Test Tenant Alpha Template V1").
    *   [ ] **Step 1.4:** Enter valid HTML content into the "Template HTML Content" field (e.g., `<h1>Test Contract</h1><p>{{client_name}}</p><p>Details...</p>`).
    *   [ ] **Step 1.5:** Click "Create Template".
    *   [ ] **Verification 1.5.1:** A success message is displayed (e.g., "Template saved successfully!").
    *   [ ] **Verification 1.5.2:** The API call `POST /contract-api/template/` was successful (check network tools/backend logs).
    *   [ ] **Verification 1.5.3:** The page reflects the saved name and content.
    *   [ ] **Verification 1.5.4:** The save button is now labeled "Update Template".

*   **Scenario 2: View and Update Existing Template**
    *   [ ] **Step 2.1:** Log in as a tenant who *has* an existing contract template (e.g., the tenant from Scenario 1).
    *   [ ] **Step 2.2:** Navigate to "Contracts" > "Templates".
    *   [ ] **Verification 2.2.1:** The page loads correctly.
    *   [ ] **Verification 2.2.2:** The previously saved template name is displayed in the "Template Name" field.
    *   [ ] **Verification 2.2.3:** The previously saved HTML content is displayed in the "Template HTML Content" field.
    *   [ ] **Verification 2.2.4:** The save button is labeled "Update Template".
    *   [ ] **Step 2.3:** Modify the "Template Name" (e.g., "Test Tenant Alpha Template V2").
    *   [ ] **Step 2.4:** Modify the HTML content (e.g., add a new paragraph `<h2>Updated Section</h2>`).
    *   [ ] **Step 2.5:** Click "Update Template".
    *   [ ] **Verification 2.5.1:** A success message is displayed.
    *   [ ] **Verification 2.5.2:** The API call `PUT /contract-api/template/` was successful.
    *   [ ] **Verification 2.5.3:** The page reflects the updated name and content.
    *   [ ] **Step 2.6:** Refresh the page.
    *   [ ] **Verification 2.6.1:** The updated name and content persist.

*   **Scenario 3: Attempt to Save Empty Template**
    *   [ ] **Step 3.1:** Navigate to the template editor.
    *   [ ] **Step 3.2:** Clear the "Template HTML Content" field.
    *   [ ] **Step 3.3:** Click "Create Template" or "Update Template".
    *   [ ] **Verification 3.3.1:** An error message is displayed (e.g., "Cannot save empty template.").
    *   [ ] **Verification 3.3.2:** No API call was made.

### B. Client Contracts Listing (`/contracts/clients`)

*   **Prerequisites:** At least one contract has been generated for a client of the test tenant, and at least one of these contracts is signed, and one is awaiting signature.
*   **Scenario 4: View Client Contracts List**
    *   [ ] **Step 4.1:** Log in as the test tenant.
    *   [ ] **Step 4.2:** Navigate to "Contracts" > "Client Contracts".
    *   [ ] **Verification 4.2.1:** The page loads correctly.
    *   [ ] **Verification 4.2.2:** The API call `GET /contract-api/contracts/` is made successfully.
    *   [ ] **Verification 4.2.3:** A table of contracts is displayed with columns: Client ID, Client Phone, Status, Generated At, Signed At, Actions.
    *   [ ] **Verification 4.2.4:** For a contract with `status: "awaiting_signature"`:
        *   [ ] Status is displayed correctly (e.g., "Awaiting Signature" chip).
        *   [ ] "Signed At" is empty or shows "-".
        *   [ ] A "View PDF" button is present.
    *   [ ] **Verification 4.2.5:** For a contract with `status: "signed"`:
        *   [ ] Status is displayed correctly (e.g., "Signed" chip).
        *   [ ] "Signed At" shows a valid date/time.
        *   [ ] A "View PDF" button is present.
    *   [ ] **Step 4.3 (View Unsigned PDF):** Click "View PDF" for a contract that is "awaiting_signature".
    *   [ ] **Verification 4.3.1:** An API call to `GET /contract-api/contracts/{contract_db_id}/public-details` is made for that contract.
    *   [ ] **Verification 4.3.2:** A new browser tab opens with the PDF specified in `pdf_download_url` (this should be the unsigned version).
    *   [ ] **Step 4.4 (View Signed PDF):** Click "View PDF" for a contract that is "signed".
    *   [ ] **Verification 4.4.1:** An API call to `GET /contract-api/contracts/{contract_db_id}/public-details` is made.
    *   [ ] **Verification 4.4.2:** A new browser tab opens with the PDF specified in `pdf_download_url` (this should be the signed version).

---

## II. Client-Facing Features (Public Access)

### C. Public Contract Signing (`/contracts/view/{contract_db_id}`)

*   **Prerequisites:** A contract has been generated for a client and is `awaiting_signature`. The `frontend_url` for this contract is known (e.g., from the tenant's view in Scenario 4 or directly from backend data).
*   **Scenario 5: Client Views and Signs Contract**
    *   [ ] **Step 5.1:** Access the public contract signing URL (e.g., `https://<frontend_domain>/contracts/view/<contract_id_awaiting_signature>`) in a browser (preferably incognito/logged out of tenant account).
    *   [ ] **Verification 5.1.1:** The page loads correctly.
    *   [ ] **Verification 5.1.2:** An API call to `GET /contract-api/contracts/{contract_db_id}/public-details` is made.
    *   [ ] **Verification 5.1.3:** The contract PDF is displayed (e.g., within an iframe) using the `pdf_download_url` from the API response.
    *   [ ] **Verification 5.1.4:** A signing button (e.g., "Li e Aceito os Termos") is present but initially disabled (or enabled after PDF load/scroll).
    *   [ ] **Verification 5.1.5:** (If scroll to sign is implemented for PDF iframe) The button becomes enabled once the PDF is loaded/scrolled (Note: iframe scroll detection can be tricky; test primary mechanism).
    *   [ ] **Step 5.2:** Click the signing button.
    *   [ ] **Verification 5.2.1:** An API call `POST /contract-api/sign/{contract_db_id}` is made with the correct payload (including `client_id`, `client_phone_number` from public details, and `device_info`).
    *   [ ] **Verification 5.2.2:** A success message is displayed (e.g., "Contract signed successfully!").
    *   [ ] **Verification 5.2.3:** The signing button becomes disabled or changes text (e.g., "Already Signed").
    *   [ ] **Verification 5.2.4:** The page might display a confirmation that the contract is now signed, potentially showing the signed date.

*   **Scenario 6: Client Attempts to Sign an Already Signed Contract**
    *   [ ] **Step 6.1:** Access the public contract signing URL for the contract that was just signed in Scenario 5.
    *   [ ] **Verification 6.1.1:** The page loads correctly.
    *   [ ] **Verification 6.1.2:** The API call to `GET /contract-api/contracts/{contract_db_id}/public-details` is made.
    *   [ ] **Verification 6.1.3:** The page indicates the contract is already signed (e.g., an alert message: "This contract has already been signed on ...").
    *   [ ] **Verification 6.1.4:** The PDF displayed (via `pdf_download_url`) should be the **signed version**.
    *   [ ] **Verification 6.1.5:** The signing button is disabled or shows "Already Signed".
    *   [ ] **Step 6.2 (Optional):** If the button is somehow enabled and clicked, the signing attempt should fail gracefully (e.g., backend returns 409 Conflict, frontend shows an appropriate message).

*   **Scenario 7: Accessing an Invalid Contract Link**
    *   [ ] **Step 7.1:** Access a contract signing URL with an invalid/non-existent `contract_db_id` (e.g., `/contracts/view/invalid-uuid`).
    *   [ ] **Verification 7.1.1:** The API call `GET /contract-api/contracts/.../public-details` returns a 404.
    *   [ ] **Verification 7.1.2:** The page displays an appropriate error message (e.g., "Error loading contract: ... This link may be invalid or expired.").

---

**Notes & Edge Cases to Consider:**

*   [ ] Responsiveness: Test on different screen sizes (desktop, tablet, mobile).
*   [ ] Error Handling: Verify clear error messages for API failures (network issues, server errors beyond specific 404s/409s).
*   [ ] Security: Basic check that tenant A cannot see/edit tenant B's template or contracts.
*   [ ] If `content` field is still part of `PublicContractDetails` and displayed alongside PDF: ensure it behaves as expected.
*   [ ] If template uses variables (e.g., `{{client_name}}`), ensure they are correctly populated in the generated PDF when viewed by the client. 