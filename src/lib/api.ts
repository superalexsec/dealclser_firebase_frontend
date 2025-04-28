import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Helper to get the backend URL from the runtime config injected into the window
const getBackendUrl = (): string => {
  // Access the configuration potentially set by an external script (e.g., in index.html)
  const url = (window as any).runtimeConfig?.backendUrl;
  if (!url) {
    console.error('Backend URL (window.runtimeConfig.backendUrl) is not configured!');
    // Provide a default fallback for local development or throw an error
    // Throwing an error might be safer to prevent unexpected behavior
    // return 'http://localhost:8000'; // Example fallback for local dev
     throw new Error('Backend URL is not configured.');
  }
  return url;
};

const apiClient: AxiosInstance = axios.create({
  // Base URL is set dynamically by the interceptor to ensure it uses the latest
  // value from window.runtimeConfig, in case it's loaded asynchronously.
  // baseURL: getBackendUrl(), // Setting initial baseURL is still good practice
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

    // Ensure the baseURL is always up-to-date from the runtime config
    // This handles cases where the config might be loaded after initial setup
    try {
        config.baseURL = getBackendUrl();
    } catch (error) {
        // Log the error but allow the request to proceed.
        // If the URL is truly missing/invalid, the request will likely fail later.
        console.error("Failed to update backend URL in interceptor, request might fail:", error);
    }

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


// Type for the request payload of PUT /flows/modules/order
export interface UpdateModuleOrderPayload {
  ordered_module_ids: string[];
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