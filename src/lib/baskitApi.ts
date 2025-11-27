// src/lib/baskitApi.ts

const API_KEY = import.meta.env.VITE_BASKIT_API_KEY;
const API_PROD = import.meta.env.VITE_BASKIT_API_PROD;
const API_DEV = import.meta.env.VITE_BASKIT_API_DEV;

export type BaskitApiEnv = 'prod' | 'dev';

function getBaseUrl(env: BaskitApiEnv = 'prod') {
  return env === 'prod' ? API_PROD : API_DEV;
}

export async function baskitApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  env: BaskitApiEnv = 'prod'
): Promise<T> {
  const url = getBaseUrl(env) + endpoint;
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
