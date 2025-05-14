import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Use environment variable for backend URL
const backendUrl = process.env.REACT_APP_BACKEND_URL;

if (!backendUrl) {
  console.error('Backend URL environment variable REACT_APP_BACKEND_URL is not configured!');
  // Optionally throw error during development if not set
  // throw new Error('REACT_APP_BACKEND_URL is not set.');
}

const apiClient: AxiosInstance = axios.create({
  // Set baseURL from environment variable during initialization
  baseURL: backendUrl, 
  // REMOVED default Content-Type header. Axios will set it appropriately per request.
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Axios request interceptor to dynamically add the Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Retrieve the auth token from localStorage.
    // Ensure your AuthProvider saves the token with this key ('authToken').
    const token = localStorage.getItem('authToken');

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // REMOVED dynamic baseURL update logic
    // The baseURL is now set once during creation from the env var

    return config;
  },
  (error) => {
    // Handle setup errors before the request is sent
    console.error('Axios request setup error:', error);
    return Promise.reject(error);
  }
);

// Axios response interceptor (optional but recommended)
apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes outside the range of 2xx cause this function to trigger
    // Handle common errors globally if desired (e.g., 401 Unauthorized for logout)
    if (error.response?.status === 401) {
      console.error('Unauthorized access - 401');
      // Optionally trigger logout action here
      // e.g., localStorage.removeItem('authToken'); window.location.href = '/';
    }
    return Promise.reject(error);
  }
);


export default apiClient;

// --- Type Definitions for API Payloads ---

// --- Profile Types --- 
export interface TenantData {
  name: string;
  email: string;
  phone: string;
  person_name: string;
  address: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  client_register_custom_question?: string | null;
}

export interface TenantUpdate {
  name?: string;
  phone?: string;
  person_name?: string;
  address?: string;
}

// --- Settings Types (WhatsApp Config) ---
export interface WhatsappConfig {
  phone_number_id: string | null;
  phone_number: string | null;
  verification_token: string | null;
  access_token: string | null;
  webhook_url: string | null;
  is_active: boolean;
  webhook_verified: boolean;
}

export interface WhatsappConfigUpdate {
  phone_number_id?: string | null;
  phone_number?: string | null;
  access_token?: string | null; 
  verification_token?: string | null;
}

// Represents the structure of a module as returned by the backend's module order endpoint
export interface BackendModuleData {
  name: string;
  description: string;
  id: string; // Module UUID
  created_at: string;
}

export interface BackendModuleOrderEntry {
  id: string; // The UUID of the tenant_module_order record
  module_id: string; // The UUID of the actual module
  tenant_id: string; // Tenant identifier
  order_position: number; // The order sequence number
  is_active: boolean; // Whether the module is active for the tenant (backend state)
  module: BackendModuleData; // Nested module details
  // description?: string; // Description is now inside module object
}

// Type for the response of GET /flows/modules/order
export type ModuleOrderResponse = BackendModuleOrderEntry[];

// --- NEW: Add definition for ModuleUI used in frontend ---
// This extends the backend type with a UI-specific flag
export interface ModuleUI extends BackendModuleOrderEntry {
    ui_is_active: boolean;
}

// Type for the request payload of PUT /flows/modules/order
// --- UPDATED: Match the actual payload sent by ModuleFlow.tsx ---
export interface ModuleUpdateData {
    module_id: string;
    is_active: boolean;
}
export interface UpdateModuleOrderPayload {
  // ordered_module_ids: string[]; // Original incorrect type
  modules: ModuleUpdateData[];
} 

// --- Types for PATCHing Module Order Active Status --- (Assumed Endpoint)
export interface UpdateModuleActiveStatusPayload {
  is_active: boolean;
}

// --- Types for Message Flow --- 

// Represents a single step (message) within a message flow
export interface MessageFlowStep {
  id: string; // Assuming backend provides an ID for steps if needed for keys
  step_number: number;
  message_content: string;
  // Add other relevant fields returned by the backend if needed
}

// Represents a full message flow as returned by the backend
export interface BackendMessageFlow {
  id: string; // The flow_id
  name: string; // Name of the flow (e.g., "Welcome Flow")
  module_id: string; // The module this flow belongs to
  tenant_id: string;
  steps: MessageFlowStep[];
  is_active: boolean;
  // Add other relevant fields like created_at, updated_at if needed
}

// Type for the response of GET /flows/message-flows/module/{module_id}
export type MessageFlowsResponse = BackendMessageFlow[];

// Type for the request payload of PUT /flows/message-flows/{flow_id}/steps
// Backend expects an array of step objects, each containing message_content
export interface UpdateMessageFlowStepsPayload {
  steps: Pick<MessageFlowStep, 'message_content'>[]; 
}

// --- ADD Definition for updateModuleOrder --- 
export const updateModuleOrder = async (payload: UpdateModuleOrderPayload, token?: string | null): Promise<ModuleOrderResponse> => {
    // --- DIAGNOSTIC LOG --- 
    console.log('updateModuleOrder apiClient defaults:', apiClient.defaults);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await apiClient.put<ModuleOrderResponse>('/flows/modules/order', payload, config);
    return data; // Assuming backend returns the updated list like the GET
};

// Fetch module order (can potentially reuse query data)
export const fetchModuleOrder = async (token?: string | null): Promise<ModuleOrderResponse> => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await apiClient.get<ModuleOrderResponse>('/flows/modules/order', config);
  return data.sort((a, b) => a.order_position - b.order_position);
};

// Fetch message flows for a specific module
export const fetchMessageFlowsForModule = async (moduleId: string, token?: string | null): Promise<MessageFlowsResponse> => {
  if (!moduleId) return []; // Don't fetch if no module is selected
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await apiClient.get<MessageFlowsResponse>(`/flows/message-flows/module/${moduleId}`, config);
  // Maybe sort flows if needed? e.g., by name or is_active
  return data;
};

// Update the steps of a specific message flow
export const updateMessageFlowSteps = async (
  flowId: string,
  payload: UpdateMessageFlowStepsPayload,
  token?: string | null
): Promise<void> => {
  if (!flowId) throw new Error('Flow ID is required to update steps.');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  await apiClient.put(`/flows/message-flows/${flowId}/steps`, payload, config);
}; 

// --- Profile API Functions ---
export const fetchTenantData = async (token?: string | null): Promise<TenantData> => {
    if (!token) throw new Error('Authentication token is required.');
    const { data } = await apiClient.get<TenantData>('/users/me', { 
        headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
};

export const updateTenantData = async (updateData: TenantUpdate, token?: string | null): Promise<TenantData> => {
    if (!token) throw new Error('Authentication token is required.');
    const { data } = await apiClient.put<TenantData>('/tenants/me', updateData, { 
        headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
};

export const logoutTenant = async (token?: string | null): Promise<void> => {
    if (!token) throw new Error('Authentication token is required.');
    await apiClient.post('/logout', {}, { 
        headers: { Authorization: `Bearer ${token}` } 
    });
};

export const deleteTenant = async (token?: string | null): Promise<void> => {
    if (!token) throw new Error('Authentication token is required.');
    await apiClient.delete('/tenants/me', { 
        headers: { Authorization: `Bearer ${token}` } 
    });
};

// --- Settings API Functions ---
export const fetchWhatsappConfig = async (token?: string | null): Promise<WhatsappConfig> => {
    if (!token) throw new Error('Authentication token is required.');
    const { data } = await apiClient.get<WhatsappConfig>('/tenants/me/whatsapp-config', { 
        headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
};

export const updateWhatsappConfig = async (updateData: WhatsappConfigUpdate, token?: string | null): Promise<WhatsappConfig> => {
    if (!token) throw new Error('Authentication token is required.');
    const { data } = await apiClient.put<WhatsappConfig>('/tenants/me/whatsapp-config', updateData, { 
        headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
}; 

// --- ADD Client Management Types ---

// Matches schemas.Client from backend README
export interface Client {
    id: string;
    tenant_id: string;
    client_identification: string; // Renamed from cpf_cnpj
    first_name: string; // Added
    surname: string; // Added
    // name: string; // Removed, use first_name and surname
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    client_phone_number: string | null; // Renamed from phone
    email: string | null;
    date_of_birth?: string | null; // NEW: Add date_of_birth field
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
    zip_code: string | null; // Added based on DB
    custom_field: string | null; // Added based on DB
}

// Matches schemas.ClientCreate from backend README
export interface ClientCreate {
    client_identification: string; // Renamed from cpf_cnpj
    first_name: string; // Added
    surname: string; // Added
    // name: string; // Removed
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    client_phone_number?: string | null; // Renamed from phone
    email?: string | null;
    date_of_birth?: string | null; // NEW: Add date_of_birth field
    zip_code?: string | null; // Added based on DB
    // custom_field is likely not set on creation unless specified
}

// Matches schemas.ClientUpdate from backend README
// Typically allows updating a subset of fields
export interface ClientUpdate {
    first_name?: string; // Updated
    surname?: string; // Added
    // name?: string; // Removed
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    client_phone_number?: string | null; // Renamed from phone
    email?: string | null;
    date_of_birth?: string | null; // NEW: Add date_of_birth field
    zip_code?: string | null; // Added based on DB
    custom_field?: string | null; // Added based on DB
    // Don't usually allow changing client_identification or tenant_id
}

// --- ADD API Function Definitions ---

// --- ADD Client API Functions ---

// Fetch clients (GET /clients)
export const fetchClients = async (skip: number = 0, limit: number = 100, token?: string | null): Promise<Client[]> => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  // Add query parameters for pagination
  const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  // Add trailing slash to the endpoint URL
  const { data } = await apiClient.get<Client[]>(`/clients/?${params.toString()}`, config);
  return data;
};

// Create a new client (POST /clients)
export const createClient = async (clientData: ClientCreate, token?: string | null): Promise<Client> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    // Add trailing slash to the endpoint URL
    const { data } = await apiClient.post<Client>('/clients/', clientData, config);
    return data;
};

// --- OPTIONAL: Add Update and Delete Client Functions later if needed ---
export const updateClient = async (clientId: string, updateData: ClientUpdate, token?: string | null): Promise<Client> => {
  if (!clientId) throw new Error('Client ID is required for update.');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  // Remove trailing slash for individual resource PUT
  const { data } = await apiClient.put<Client>(`/clients/${clientId}`, updateData, config);
  return data;
};

export const deleteClient = async (clientId: string, token?: string | null): Promise<void> => {
  if (!clientId) throw new Error('Client ID is required for delete.');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  // Remove trailing slash for individual resource DELETE
  await apiClient.delete(`/clients/${clientId}`, config);
}; 

// --- NEW: Product Catalog Types ---

export interface Category {
  id: string; // Assuming UUID based on PRODUCT_UUID format
  name: string;
  description?: string | null;
  tenant_id: string; // Added based on schema
  is_active: boolean; // Added based on schema
  created_at: string; // Added based on schema
  updated_at: string; // Added based on schema
  // Add other fields if available from the actual API response
}

export interface Product {
  id: string; // Assuming UUID
  tenant_id: string; // Added based on schema
  name: string;
  description?: string | null;
  price: string; // Price is a string from backend
  category_id: string; // Foreign key to Category
  sku?: string | null; // Added based on schema
  is_active: boolean; // is_active is guaranteed boolean
  created_at: string; // Added based on schema
  updated_at: string; // Added based on schema
  image_urls: string[]; // Added based on schema (array of URLs)
  // Add other fields if available
}

// --- NEW: Type for creating a Category ---
export interface CategoryCreate {
    name: string;
    description?: string | null;
    // tenant_id is handled by backend based on token
    // is_active defaults to true in backend?
}

export type CategoriesResponse = Category[];

// Interface matching the actual backend response for GET /products
export interface ProductListResponse {
    products: Product[]; // Updated Product type
    has_more: boolean;
    // Add total_count or other pagination fields if backend provides them
}

// --- NEW: Product Catalog API Functions ---

/**
 * Fetches available product categories for the tenant.
 */
export const fetchCategories = async (token: string | null): Promise<CategoriesResponse> => {
  if (!token) throw new Error('Authentication token is required to fetch categories.');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await apiClient.get<CategoriesResponse>('/products-api/categories/', config);
  return data;
};

/**
 * Fetches products, optionally filtered by category and paginated.
 */
export const fetchProducts = async (
  token: string | null,
  page: number = 1,
  categoryId?: string | null
): Promise<ProductListResponse> => {
    if (!token) throw new Error('Authentication token is required to fetch products.');
    
    const params: Record<string, any> = { page };
    if (categoryId) {
        params.category_id = categoryId;
    }
    
    const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params // Add params to the config
    };

    const { data } = await apiClient.get<ProductListResponse>('/products-api/products/', config);
    return data;
};

// API function to create a Category
export const createCategory = async (categoryData: CategoryCreate, token: string | null): Promise<Category> => {
  if (!token) throw new Error('Authentication token is required to create a category.');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await apiClient.post<Category>('/products-api/categories/', categoryData, config);
  return data;
};

// Type for creating a Product
export interface ProductCreate {
    name: string;
    description?: string | null;
    price: string; // Price should be sent as string
    category_id: string;
    sku?: string | null; // Added SKU
    is_active?: boolean; // Added is_active (optional, default likely true)
}

// API function to create a Product (Handles file uploads with metadata field)
export const createProduct = async (
    productData: ProductCreate, 
    files: File[] | null, // Accept files
    token: string | null
): Promise<Product> => {
    if (!token) throw new Error('Authentication token is required to create a product.');

    const formData = new FormData();
    
    // 1. Create metadata object (ensure all needed fields are included)
    //    This structure must match what the backend /products-api/products/ POST endpoint expects for metadata.
    const metadata = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.category_id,
        sku: productData.sku,
        is_active: productData.is_active !== undefined ? productData.is_active : true, // Default to true if undefined
    };

    // 2. Stringify the metadata object
    const metadataString = JSON.stringify(metadata);

    // 3. Append the metadata string as a single field
    formData.append('metadata', metadataString);

    // 4. Append files as before
    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append('files', file, file.name); // Backend expects 'files' and might use original file name
        });
    }
    
    // The interceptor will add the Authorization header.
    // Content-Type will be set to multipart/form-data by Axios automatically for FormData.
    const { data } = await apiClient.post<Product>('/products-api/products/', formData, {
         headers: {
             Authorization: `Bearer ${token}`,
             // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
         }
    });
    return data;
};

// --- NEW: Type for updating a Product ---
// Allow updating most fields, including is_active
export interface ProductUpdate {
    name?: string;
    description?: string | null;
    price?: string | null; // Price is optional string
    category_id?: string;
    sku?: string | null; // Allow updating SKU
    is_active?: boolean; 
}

// --- NEW: API function to update a Product ---
// Assuming PUT request to /products-api/products/{product_id}/
export const updateProduct = async (productId: string, productData: ProductUpdate, token: string | null): Promise<Product> => {
  if (!token) throw new Error('Authentication token is required to update a product.');
  if (!productId) throw new Error('Product ID is required to update a product.');

  const config = { headers: { Authorization: `Bearer ${token}` } };
  // Ensure the endpoint is correct: /products-api/products/{product_id}
  const { data } = await apiClient.put<Product>(`/products-api/products/${productId}`, productData, config);
  return data;
};

// --- NEW: API function to delete a Product ---
export const deleteProduct = async (productId: string, token: string | null): Promise<void> => {
    if (!token) { // Rely on interceptor for actual auth failure, but good for early exit
        throw new Error('Authentication token is required to delete a product.');
    }
    if (!productId) {
        throw new Error('Product ID is required to delete a product.');
    }
    
    // Axios interceptor adds the Authorization header.
    // The endpoint is /products-api/products/{product_id}
    // A successful DELETE will return a 204 No Content. Axios handles this by
    // not attempting to parse response.data, which will be null or undefined.
    await apiClient.delete(`/products-api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` } // Explicitly pass for clarity, though interceptor does it
    });
    // No return value needed as per 204 No Content.
};

// --- NEW: API function to add an image to a product ---
export const addProductImage = async (productId: string, imageFile: File, token: string | null): Promise<Product> => {
    if (!token) throw new Error('Authentication token is required to add an image.');
    if (!productId) throw new Error('Product ID is required to add an image.');
    if (!imageFile) throw new Error('Image file is required.');

    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name);

    // Interceptor handles Authorization header. Axios handles Content-Type for FormData.
    const { data } = await apiClient.post<Product>(`/products-api/products/${productId}/images`, formData, {
        headers: { Authorization: `Bearer ${token}` } // Explicit token for clarity, though interceptor helps
    });
    return data; // Backend returns the updated product object
};

// --- NEW: API function to delete an image from a product ---
export const deleteProductImage = async (productId: string, imageUrl: string, token: string | null): Promise<Product> => {
    if (!token) throw new Error('Authentication token is required to delete an image.');
    if (!productId) throw new Error('Product ID is required to delete an image.');
    if (!imageUrl) throw new Error('Image URL is required for deletion.');

    // Interceptor handles Authorization header.
    const { data } = await apiClient.delete<Product>(`/products-api/products/${productId}/images`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        data: { image_url: imageUrl }, // Axios uses 'data' field for DELETE request body
    });
    return data; // Backend returns the updated product object
};

// --- Cart Types (Based on Backend API Spec) ---

// Interface for the response from cart actions (add, remove, clear, checkout)
export interface CartActionResponse {
  success: boolean;
}

// Interface for an item displayed in the cart view
export interface CartItemView {
  name: string; // Product name
  quantity: number;
  price_at_addition: string; // Price as a string
  // Note: product_id might not be directly available here per the spec?
  // Need clarification if frontend needs product_id for remove action mapping.
}

// Interface for the cart view response
export interface CartViewResponse {
  items: CartItemView[];
  total: string; // Total price as a string
}

// Payload for adding an item to the cart
export interface AddToCartPayload {
    client_id: string;
    product_id: string;
    quantity: number;
}

// Payload for removing an item from the cart
export interface RemoveFromCartPayload {
    client_id: string;
    product_id: string;
}

// Payload for clearing or checking out the cart
export interface CartActionPayload {
    client_id: string;
}

// --- Cart API Functions (Based on tenant_products_API.md) ---

/**
 * Fetches the cart contents for a specific client.
 */
export const fetchCart = async (clientId: string, token: string | null): Promise<CartViewResponse> => {
    if (!token) throw new Error('Authentication token is required.');
    if (!clientId) throw new Error('Client ID is required to fetch cart.');

    const params = new URLSearchParams({ client_id: clientId });

    const response = await apiClient.get<CartViewResponse>(`/products-api/cart/view`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
    });
    return response.data;
};

/**
 * Adds an item to a specific client's cart.
 * NOTE: Unlikely to be used directly from Tenant Admin UI.
 */
export const addToCart = async (payload: AddToCartPayload, token: string | null): Promise<CartActionResponse> => {
    if (!token) throw new Error('Authentication token is required.');
    const response = await apiClient.post<CartActionResponse>('/products-api/cart/add', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

/**
 * Removes an item from a specific client's cart.
 */
export const removeFromCart = async (payload: RemoveFromCartPayload, token: string | null): Promise<CartActionResponse> => {
    if (!token) throw new Error('Authentication token is required.');
    const response = await apiClient.post<CartActionResponse>('/products-api/cart/remove', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

/**
 * Clears all items from a specific client's cart.
 */
export const clearCart = async (payload: CartActionPayload, token: string | null): Promise<CartActionResponse> => {
    if (!token) throw new Error('Authentication token is required.');
    const response = await apiClient.post<CartActionResponse>('/products-api/cart/clear', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

/**
 * Checks out a specific client's cart.
 * NOTE: Unlikely to be used directly from Tenant Admin UI.
 */
export const checkoutCart = async (payload: CartActionPayload, token: string | null): Promise<CartActionResponse> => {
    if (!token) throw new Error('Authentication token is required.');
    const response = await apiClient.post<CartActionResponse>('/products-api/cart/checkout', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// --- NEW: API function to delete a Category ---
export const deleteCategory = async (categoryId: string, token: string | null): Promise<void> => {
    if (!token) {
        throw new Error('Authentication token is required to delete a category.');
    }
    if (!categoryId) {
        throw new Error('Category ID is required for deletion.');
    }
    // Assuming the endpoint is /products-api/categories/{category_id}/
    // Similar to product deletion, a 204 No Content is expected on success.
    await apiClient.delete(`/products-api/categories/${categoryId}/`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // No return value needed for 204.
};

// --- Mercado Pago Config Types ---
export interface MercadoPagoConfig {
  access_token: string;
  mp_public_key: string;
  webhook_secret?: string;
  mp_user_id?: string;
  mp_application_id?: string;
}

// Fetch Mercado Pago config for the tenant
export const fetchMercadoPagoConfig = async (token?: string | null): Promise<MercadoPagoConfig> => {
  if (!token) throw new Error('Authentication token is required.');
  const { data } = await apiClient.get<MercadoPagoConfig>('/payments/mercadopago-config', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// Update Mercado Pago config for the tenant (PATCH)
export const updateMercadoPagoConfig = async (updateData: MercadoPagoConfig, token?: string | null): Promise<MercadoPagoConfig> => {
  if (!token) throw new Error('Authentication token is required.');
  const { data } = await apiClient.patch<MercadoPagoConfig>('/payments/mercadopago-config', updateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}; 

// --- Payment Sessions API ---
export interface PaymentSession {
  id: string;
  tenant_id: string;
  client_phone_number: string;
  total_amount: string;
  selected_payment_method: string;
  payment_link: string;
  payment_id_external: string;
  preference_id: string;
  current_step: string;
  created_at: string;
  updated_at: string;
  status: string;
  confirmed_at: string | null;
}

export interface PaymentSessionDetails extends PaymentSession {}

export const fetchPaymentSessions = async (clientPhoneNumber: string, token?: string | null): Promise<PaymentSession[]> => {
  if (!token) throw new Error('Authentication token is required.');
  if (!clientPhoneNumber) throw new Error('Client phone number is required.');
  const { data } = await apiClient.get<{ sessions: PaymentSession[] }>(`/payments/sessions?client_phone_number=${encodeURIComponent(clientPhoneNumber)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.sessions;
};

export const fetchPaymentSessionDetails = async (sessionId: string, token?: string | null): Promise<PaymentSessionDetails> => {
  if (!token) throw new Error('Authentication token is required.');
  if (!sessionId) throw new Error('Session ID is required.');
  const { data } = await apiClient.get<PaymentSessionDetails>(`/payments/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}; 

// --- Payment Config Types and API ---
export interface PaymentConfig {
  tenant_id: string;
  max_installments: number;
  default_payment_methods: string[];
  pix_discount: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePaymentConfigPayload {
  pix_discount?: number;
  max_installments?: number;
}

export const fetchPaymentConfig = async (token?: string | null): Promise<PaymentConfig> => {
  if (!token) throw new Error('Authentication token is required.');
  const { data } = await apiClient.get<PaymentConfig>('/payments/payment-config', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const updatePaymentConfig = async (updateData: UpdatePaymentConfigPayload, token?: string | null): Promise<PaymentConfig> => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await apiClient.put<PaymentConfig>('/settings/payments', updateData, config);
  return data;
}; 

// --- Contract Template Types ---

export interface ContractTemplateRead {
    id: string; // Assuming backend includes an ID
    name: string;
    content: string; // HTML content
    tenant_id: string;
    created_at: string;
    updated_at: string;
}

export interface ContractTemplateUpdatePayload {
    name?: string; // Optional name update
    content: string; // HTML content is required for update
}

// --- Client Contract Listing Types (Placeholder) ---

export enum ContractStatus {
    AWAITING_SIGNATURE = 'awaiting_signature',
    SIGNED = 'signed',
    GENERATED = 'generated', // Or other relevant statuses
    ERROR = 'error',
}

export interface ClientContractListItem {
    contract_db_id: string; // The ID used in URLs and signing
    client_id: string;
    client_name: string; // Need to fetch/join this potentially
    client_phone_number: string; // Need to fetch/join this potentially
    status: ContractStatus;
    generated_at: string;
    signed_at?: string | null;
    frontend_url?: string | null; // The URL for the client to view/sign
}

// --- Public Contract Signing Types ---

export interface PublicContractDetails {
    contract_db_id: string;
    pdf_download_url: string; // URL to the PDF (signed or unsigned based on status)
    client_id: string; // Needed for signing payload
    client_phone_number: string; // Needed for signing payload
    status: ContractStatus; // Current status - Confirmed present in latest test
    signed_at: string | null; // Confirmed present (null if not signed)
}

export interface DeviceInfo {
    ip_address?: string;
    user_agent?: string;
    other_details?: Record<string, any>;
}
export interface ContractSigningPayload {
    client_phone_number: string;
    client_id: string;
    device_info?: DeviceInfo;
}

export interface ContractSigningResponse {
    status: ContractStatus; // Should be 'signed' on success
    message?: string;
    signed_at?: string;
}


// --- Contract API Functions ---

// Fetch tenant's contract template
export const fetchContractTemplate = async (token?: string | null): Promise<ContractTemplateRead> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    // Use a try-catch or handle potential 404 if template doesn't exist yet
    try {
        const { data } = await apiClient.get<ContractTemplateRead>('/contract-api/template/', config);
        return data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            // Handle case where tenant has no template yet gracefully
            console.warn('No contract template found for tenant.');
            // Return a default or empty state, or rethrow specific error
            // For now, let's return a partial structure indication non-existence
             return { id: '', name: 'No Template', content: '<p>Please create a template.</p>', tenant_id: '', created_at: '', updated_at: '' };
        }
        console.error('Error fetching contract template:', error);
        throw error; // Rethrow other errors
    }
};

// Update or Create tenant's contract template (Using PUT as upsert)
// This will be split into create and updateExisting
export const updateContractTemplate = async (payload: ContractTemplateUpdatePayload, token?: string | null): Promise<ContractTemplateRead> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await apiClient.put<ContractTemplateRead>('/contract-api/template/', payload, config);
    return data;
};

// NEW: Create tenant's contract template
export const createContractTemplate = async (payload: ContractTemplateUpdatePayload, token?: string | null): Promise<ContractTemplateRead> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await apiClient.post<ContractTemplateRead>('/contract-api/template/', payload, config);
    return data;
};

// RENAMED: Update tenant's existing contract template
export const updateExistingContractTemplate = async (payload: ContractTemplateUpdatePayload, token?: string | null): Promise<ContractTemplateRead> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    // Assuming the ID of the template isn't strictly needed in the URL for PUT as it's tenant-specific (1 template per tenant)
    // If it were /contract-api/template/{templateId}, this would need adjustment.
    // Based on current info, PUT to /contract-api/template/ updates the existing one.
    const { data } = await apiClient.put<ContractTemplateRead>('/contract-api/template/', payload, config);
    return data;
};

// --- Placeholder --- Fetch list of client contracts (Backend endpoint TBD)
export const fetchClientContracts = async (token?: string | null): Promise<ClientContractListItem[]> => {
    // console.warn('fetchClientContracts: Backend endpoint /contract-api/contracts/ is not yet available.');
    // Return mock data or empty array
    // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    // return [
    //     // { contract_db_id: 'uuid-1', client_id: 'client-a', client_name: 'Client A', client_phone_number: '+123', status: ContractStatus.SIGNED, generated_at: new Date().toISOString(), signed_at: new Date().toISOString() },
    //     // { contract_db_id: 'uuid-2', client_id: 'client-b', client_name: 'Client B', client_phone_number: '+456', status: ContractStatus.AWAITING_SIGNATURE, generated_at: new Date().toISOString(), frontend_url: '/contracts/view/uuid-2' },
    // ];
    // TODO: Replace with actual API call when available:
    if (!token) {
        // This case should ideally be handled by query's enabled flag or AuthContext, 
        // but as a safeguard:
        console.warn('fetchClientContracts called without a token.');
        return []; 
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { data } = await apiClient.get<ClientContractListItem[]>('/contract-api/contracts/', config);
    return data;
};

// Fetch public details for a specific contract (Needed for signing page)
// ASSUMPTION: Endpoint exists at /contract-api/contracts/{contract_db_id}/public-details
export const fetchPublicContractDetails = async (contractDbId: string): Promise<PublicContractDetails> => {
    // console.warn('fetchPublicContractDetails: Assuming endpoint /contract-api/contracts/{contractDbId}/public-details exists.');
    // Implement mock data until endpoint is confirmed
    // await new Promise(resolve => setTimeout(resolve, 500));
    // if (contractDbId === 'mock-uuid-awaiting') {
    //     return {
    //         contract_db_id: contractDbId,
    //         pdf_download_url: '', // Placeholder, actual URL will come from API
    //         client_id: 'mock-client-uuid-123',
    //         client_phone_number: 'mock+111222333',
    //         status: ContractStatus.AWAITING_SIGNATURE,
    //         signed_at: null,
    //         content: '<p>This is a <b>mock contract</b> for signing.</p><p>Scroll down...</p><p>...</p><p>End of contract.</p>'
    //     };
    // } else if (contractDbId === 'mock-uuid-signed') {
    //      return {
    //         contract_db_id: contractDbId,
    //         pdf_download_url: '', // Placeholder
    //         client_id: 'mock-client-uuid-456',
    //         client_phone_number: 'mock+444555666',
    //         status: ContractStatus.SIGNED,
    //         signed_at: new Date().toISOString(),
    //         content: '<p>This is a contract that is already <b>signed</b>.</p>'
    //     };
    // } else {
    //      throw new Error('Mock contract not found'); // Simulate 404
    // }

    // TODO: Replace with actual API call when endpoint is confirmed:
    try {
        // This is a public endpoint, so no token/auth config needed for apiClient directly here.
        const { data } = await apiClient.get<PublicContractDetails>(`/contract-api/contracts/${contractDbId}/public-details`);
        return data;
    } catch (error) {
        console.error(`Error fetching public contract details for ${contractDbId}:`, error);
        // Rethrow or handle as per application error handling strategy
        // For instance, if error is AxiosError, you can inspect error.response
        throw error;
    }
};


// Sign a contract (Public endpoint)
export const signContract = async (contractDbId: string, payload: ContractSigningPayload): Promise<ContractSigningResponse> => {
    try {
        const { data } = await apiClient.post<ContractSigningResponse>(`/contract-api/sign/${contractDbId}`, payload);
        return data;
    } catch (error) {
        console.error(`Error signing contract ${contractDbId}:`, error);
        // Consider more specific error handling based on status codes (400, 404, 409)
        throw error;
    }
}; 