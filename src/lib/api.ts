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
  headers: {
    'Content-Type': 'application/json',
  },
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
  // id?: string; // Does the backend return/require an ID for each step?
  step_number?: number; // Does the backend return/require a step number?
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
// export const updateClient = async (clientId: string, updateData: ClientUpdate, token?: string | null): Promise<Client> => {
//   const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
//   const { data } = await apiClient.put<Client>(`/clients/${clientId}`, updateData, config);
//   return data;
// };

// export const deleteClient = async (clientId: string, token?: string | null): Promise<void> => {
//   const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
//   await apiClient.delete(`/clients/${clientId}`, config);
// }; 