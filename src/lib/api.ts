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
  if (!token) throw new Error('Authentication token is required.');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  // Assuming categories endpoint is /products-api/categories/
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
    if (!token) throw new Error('Authentication token is required.');
    // Define params ensuring category_id is only added if present
    const params: Record<string, any> = {
        page: page,
        size: 12, // Example page size
    };
    if (categoryId) {
        params.category_id = categoryId;
    }
    
    // Define config with headers and params
    const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: params
    };
    
    // Ensure the URL is correct, e.g., /products-api/products/
    const { data } = await apiClient.get<ProductListResponse>('/products-api/products/', config);
    return data;
};

// API function to create a Category
export const createCategory = async (categoryData: CategoryCreate, token: string | null): Promise<Category> => {
  if (!token) throw new Error('Authentication token is required.');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  // Assuming create category endpoint is /products-api/categories/
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
    if (!token) throw new Error('Authentication token is required.');

    const formData = new FormData();

    // 1. Create metadata object (ensure all needed fields are included)
    const metadata = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.category_id,
        sku: productData.sku,
        is_active: productData.is_active,
    };

    // 2. Stringify the metadata object
    const metadataString = JSON.stringify(metadata);

    // 3. Append the metadata string as a single field
    formData.append('metadata', metadataString);

    // 4. Append files as before
    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append('files', file, file.name);
        });
    }

    // --- DEBUGGING: Log FormData entries before sending --- 
    console.log("--- FormData Entries Before Sending ---");
    formData.forEach((value, key) => {
        if (value instanceof File) {
            console.log(`${key}: [File] ${value.name}, Type: ${value.type}, Size: ${value.size}`);
        } else {
            console.log(`${key}: ${value}`);
        }
    });
    console.log("---------------------------------------");
    // --- END DEBUGGING --- 

    // Make the POST request with FormData
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            // Content-Type is set automatically by browser/axios for FormData
        }
    };

    // Ensure the endpoint /products-api/products/ is correct
    const response = await apiClient.post<Product>('/products-api/products/', formData, config);
    return response.data;
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
  if (!token) throw new Error('Authentication token is required.');
  if (!productId) throw new Error('Product ID is required for update.');

  const config = { headers: { Authorization: `Bearer ${token}` } };
  // Ensure the endpoint is correct: /products-api/products/{product_id}
  const { data } = await apiClient.put<Product>(`/products-api/products/${productId}`, productData, config);
  return data;
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

// --- Existing API Functions Continue Below ---
// ... existing code ... 