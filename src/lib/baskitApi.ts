// src/lib/baskitApi.ts

const API_KEY = import.meta.env.VITE_BASKIT_API_KEY;
const API_URL = import.meta.env.VITE_BASKIT_API_URL;
const API_USERNAME = import.meta.env.VITE_BASKIT_API_USERNAME;
const API_PASSWORD = import.meta.env.VITE_BASKIT_API_PASSWORD;

function getBaseUrl() {
  return API_URL;
}

export async function baskitApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getBaseUrl() + endpoint;
  
  const headers = {
    ...(options.headers || {}),
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Example usage:
// const data = await baskitApiRequest('products', { method: 'GET' }, 'prod');
