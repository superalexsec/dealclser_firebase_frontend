---

Subject: 405 Error on GET /payments/mercadopago-config – Request for Read Endpoint

Hi Tenant Team,

We are encountering a 405 Method Not Allowed error when attempting to retrieve the current Mercado Pago configuration using a GET request to `/payments/mercadopago-config` as per the latest backend contract and documentation. 

Currently, the backend supports POST and PATCH for registering and updating the Mercado Pago configuration, but there is no documented GET endpoint for fetching the current configuration for a tenant. This is required for the frontend Settings page to display the current Mercado Pago settings and allow users to view or edit them.

**Request:**
- Could you please clarify if a GET endpoint for `/payments/mercadopago-config` is available or planned?
- If not, could you implement a GET endpoint that returns the current Mercado Pago configuration for the authenticated tenant, matching the response structure of the POST/PATCH endpoints?

This will ensure the frontend can properly display and manage Mercado Pago settings for each tenant.

Thank you!

Best regards,
Frontend Team
