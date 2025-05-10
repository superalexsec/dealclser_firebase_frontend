Subject: New PayServ Endpoints for Tenant Payment Config (Pix Discount & Max Installments)

Hi Tenants Team,

We have added new endpoints to PayServ to allow you to get and update the Pix discount and max installments for each tenant's payment configuration. These endpoints are intended for internal use and do not require authentication from PayServ, as your backend will proxy requests and handle authentication.

---

**Endpoints:**

1. **Get Current Payment Config**
   - **GET** `/v1/tenants/{tenant_id}/payment-config`
   - **Response Example:**
     ```json
     {
       "tenant_id": "44921cd3-2158-4dde-9551-084f020f3ee4",
       "max_installments": 12,
       "default_payment_methods": ["PIX", "CREDIT_CARD"],
       "pix_discount": 4.0,
       "created_at": "2024-06-10T12:00:00Z",
       "updated_at": "2024-06-10T12:00:00Z"
     }
     ```

2. **Update Pix Discount and/or Max Installments**
   - **PATCH** `/v1/tenants/{tenant_id}/payment-config`
   - **Request Body (any or both fields):**
     ```json
     {
       "pix_discount": 5.0,
       "max_installments": 10
     }
     ```
   - **Response:** Returns the updated config (same as GET response).

---

**Notes:**
- You can update either `pix_discount`, `max_installments`, or both in a single PATCH request.
- No authentication is required from PayServ; your backend should proxy and secure these endpoints.

Let us know if you need any changes or further integration!

Best,
Payment Service Team
