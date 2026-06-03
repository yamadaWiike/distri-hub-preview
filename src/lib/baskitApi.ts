// src/lib/baskitApi.ts
import axios from 'axios';

const API_KEY = import.meta.env.VITE_BASKIT_API_KEY;
const API_URL = import.meta.env.VITE_BASKIT_API_URL;
const isLocalPreview =
  import.meta.env.DEV &&
  (!import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY);
// const API_USERNAME = import.meta.env.VITE_BASKIT_API_USERNAME;
// const API_PASSWORD = import.meta.env.VITE_BASKIT_API_PASSWORD;

function getBaseUrl() {
  return API_URL;
}

export async function baskitApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check if bypass mode is enabled
  const bypassEnabled =
    import.meta.env.VITE_BASKIT_API_BYPASS === 'true' ||
    isLocalPreview ||
    !API_URL ||
    !API_KEY;
  
  if (bypassEnabled) {
    // Return mock success response
    return {
      statusCode: 200,
      message: 'Bypassed - mock response',
      success: true
    } as T;
  }

  const url = getBaseUrl() + endpoint;

  const headers: Record<string, string> = {
    "x-api-key": API_KEY,
  };

  // Only add Content-Type for requests with a body
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await axios({
    url,
    method: options.method || 'POST',
    headers,
    data: options.body,
  });

  return response.data;
}

// Example usage:
// const data = await baskitApiRequest('products', { method: 'GET' }, 'prod');
