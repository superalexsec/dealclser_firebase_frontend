**Subject: New Endpoint for Tenant Logo Upload**

Hi Frontend Team,

The Backend Service now has a fully functional endpoint for tenants to upload their company logos.

Please update the tenant profile/settings page in the web GUI to include a file upload component that interacts with this new endpoint.

### Endpoint Details

*   **Method:** `POST`
*   **URL:** `/tenant/branding/logo`
*   **Authentication:** Requires the tenant's standard JWT Bearer token.
*   **Request Body:** The request should be `multipart/form-data`, with the image file attached under the field name `file`.

### Sample `curl` Request

```bash
curl -X POST 'http://BACKEND_URL:8080/tenant/branding/logo' \\
--header 'Authorization: Bearer YOUR_TENANT_JWT_TOKEN' \\
--form 'file=@"/path/to/your/logo.png"'
```

### Success Response (201 Created)

On a successful upload, the endpoint will return a JSON object containing the public URL of the newly uploaded logo. You can use this URL directly in `<img>` tags to display the tenant's logo in the UI without having to proxy it through the backend.

```json
{
  "success": true,
  "message": "Logo uploaded successfully.",
  "public_url": "https://storage.googleapis.com/messagingtextbot-storage/44921cd3-2158-4dde-9551-084f020f3ee4/branding/logo.png"
}
```

### Displaying the Logo

To display the logo, you should retrieve the `public_url` from the tenant's data (we now store it in the database) and use it directly. The old endpoint for downloading the logo through the backend has been removed.

Please let us know if you have any questions.

Best,
The Backend Service Team
