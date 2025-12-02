// src/lib/baskitApi.ts
import axios from 'axios';

const API_KEY = import.meta.env.VITE_BASKIT_API_KEY;
const API_URL = import.meta.env.VITE_BASKIT_API_URL;
// const API_USERNAME = import.meta.env.VITE_BASKIT_API_USERNAME;
// const API_PASSWORD = import.meta.env.VITE_BASKIT_API_PASSWORD;

function getBaseUrl() {
  return API_URL;
}

export async function baskitApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
