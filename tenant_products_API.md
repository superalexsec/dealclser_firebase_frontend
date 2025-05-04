# Products API Endpoint Testing Checklist

This checklist outlines the steps to test the `/products-api/*` proxy endpoints using `curl`.

**Prerequisites:**

1.  The `tenant-app-backend` service must be deployed to Cloud Run with the latest changes (including the `PRODUCTS_SERVICE_URL` secret).
2.  The separate `Products Service` must be running and accessible at the URL specified in the `PRODUCTS_SERVICE_URL` secret.
3.  You need valid tenant credentials (username/password) to obtain an authentication token.
4.  You need `curl` and `jq` (optional, for easier JSON parsing) installed locally.

**Setup:**

*   [ ] **Set Base URL:** Replace `<YOUR_CLOUD_RUN_URL>` with the actual URL of your deployed `tenant-app-backend` service.
    ```bash
    export URL="<YOUR_CLOUD_RUN_URL>"
    echo "URL set to: $URL"
    ```
    *Notes:*

*   [ ] **Obtain Auth Token:** Replace `<TENANT_USERNAME>` and `<TENANT_PASSWORD>` with valid credentials.
    ```bash
    export TOKEN=$(curl -L -X POST "$URL/auth/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=<TENANT_USERNAME>&password=<TENANT_PASSWORD>" | jq -r .access_token)
    echo "Token obtained: $TOKEN" 
    # Check if token is empty - if so, authentication failed
    if [ -z "$TOKEN" ]; then echo "ERROR: Failed to get token"; fi 
    ```
    *Notes:*

*   [ ] **Set Client UUID:** This represents the end-user interacting with the cart. We'll use a fixed one for this test sequence.
    ```bash
    export CLIENT_UUID="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" # Or use export CLIENT_UUID=$(uuidgen)
    echo "Client UUID set to: $CLIENT_UUID"
    ```
    *Notes:*

**Test Cases:**

*   [x] **1. Get Categories:** Fetch available product categories.
    ```bash
    curl -L -X GET "$URL/products-api/categories/" \
      -H "Authorization: Bearer $TOKEN" | cat 
    # Optional: Save a category ID for later tests
    # export CATEGORY_ID="<PASTE_A_CATEGORY_ID_FROM_OUTPUT>" 
    ```
    *Notes:* Success, received list of categories.

*   [x] **2. Get Products (All):** Fetch the first page of all products.
    ```bash
    curl -L -X GET "$URL/products-api/products/" \
      -H "Authorization: Bearer $TOKEN" | cat
    # Optional: Save a product ID for later tests
    # export PRODUCT_UUID="<PASTE_A_PRODUCT_ID_FROM_OUTPUT>"
    ```
    *Notes:* Success, received list of products.

*   [x] **3. Get Products (Filtered by Category):** Fetch products for a specific category (Requires `CATEGORY_ID` to be set in step 1).
    ```bash
    # Ensure CATEGORY_ID is set from step 1 before running
    if [ -z "$CATEGORY_ID" ]; then echo "ERROR: CATEGORY_ID not set"; else \
    curl -L -X GET "$URL/products-api/products/?category_id=$CATEGORY_ID" \
      -H "Authorization: Bearer $TOKEN" | cat; \
    fi
    ```
    *Notes:* OK.

*   [x] **4. Get Products (Pagination):** Fetch the second page of products.
    ```bash
    curl -L -X GET "$URL/products-api/products/?page=2" \
      -H "Authorization: Bearer $TOKEN" | cat
    ```
    *Notes:* OK.

*   [ ] **5. Add Item to Cart:** Add a product to the client's cart (Requires `PRODUCT_UUID` to be set in step 2).
    ```bash
    # Ensure PRODUCT_UUID is set from step 2 before running
    if [ -z "$PRODUCT_UUID" ]; then echo "ERROR: PRODUCT_UUID not set"; else \
    curl -L -X POST "$URL/products-api/cart/add" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'", "product_id": "'"$PRODUCT_UUID"'", "quantity": 2}' | cat; \
    fi
    ```
    *Notes:*

*   [x] **6. View Cart:** Check the contents of the cart after adding an item.
    ```bash
    curl -L -X GET "$URL/products-api/cart/view?client_id=$CLIENT_UUID" \
      -H "Authorization: Bearer $TOKEN" | cat
    ```
    *Notes:* OK. (Shows current cart state, likely empty if no items were added).

*   [ ] **7. Remove Item from Cart:** Remove the previously added product (Requires `PRODUCT_UUID` from step 2).
    ```bash
    # Ensure PRODUCT_UUID is set from step 2 before running
    if [ -z "$PRODUCT_UUID" ]; then echo "ERROR: PRODUCT_UUID not set"; else \
    curl -L -X POST "$URL/products-api/cart/remove" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'", "product_id": "'"$PRODUCT_UUID"'"}' | cat; \
    fi
    ```
    *Notes:*

*   [ ] **8. View Cart (After Remove):** Check the cart is now empty or missing the removed item.
    ```bash
    curl -L -X GET "$URL/products-api/cart/view?client_id=$CLIENT_UUID" \
      -H "Authorization: Bearer $TOKEN" | cat
    ```
    *Notes:*

*   [ ] **9. Add Item (Again):** Add an item so we can test clear/checkout. (Requires `PRODUCT_UUID`)
    ```bash
    # Ensure PRODUCT_UUID is set from step 2 before running
    if [ -z "$PRODUCT_UUID" ]; then echo "ERROR: PRODUCT_UUID not set"; else \
    curl -L -X POST "$URL/products-api/cart/add" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'", "product_id": "'"$PRODUCT_UUID"'", "quantity": 1}' | cat; \
    fi
    ```
    *Notes:*

*   [ ] **10. Clear Cart:** Clear all items from the client's cart.
    ```bash
    curl -L -X POST "$URL/products-api/cart/clear" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'"}' | cat
    ```
    *Notes:*

*   [ ] **11. View Cart (After Clear):** Check the cart is empty.
    ```bash
    curl -L -X GET "$URL/products-api/cart/view?client_id=$CLIENT_UUID" \
      -H "Authorization: Bearer $TOKEN" | cat
    ```
    *Notes:*

*   [ ] **12. Add Item (Yet Again):** Add an item so we can test checkout. (Requires `PRODUCT_UUID`)
    ```bash
    # Ensure PRODUCT_UUID is set from step 2 before running
    if [ -z "$PRODUCT_UUID" ]; then echo "ERROR: PRODUCT_UUID not set"; else \
    curl -L -X POST "$URL/products-api/cart/add" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'", "product_id": "'"$PRODUCT_UUID"'", "quantity": 3}' | cat; \
    fi
    ```
    *Notes:*

*   [ ] **13. Checkout Cart:** Perform the checkout operation.
    ```bash
    curl -L -X POST "$URL/products-api/cart/checkout" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"client_id": "'"$CLIENT_UUID"'"}' | cat
    ```
    *Notes:*

*   [ ] **14. View Cart (After Checkout):** Check the cart is likely empty after checkout (depending on Products Service logic).
    ```bash
    curl -L -X GET "$URL/products-api/cart/view?client_id=$CLIENT_UUID" \
      -H "Authorization: Bearer $TOKEN" | cat
    ```
    *Notes:* 