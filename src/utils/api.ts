// API utility functions
import { API_STATUS } from '../constants/api';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Re-export the type for convenience
export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      code: 'UNKNOWN_ERROR'
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const apiError = error as Record<string, unknown>;
    return {
      message: (apiError.message as string) || 'An error occurred',
      status: (apiError.status as number) || 500,
      code: (apiError.code as string) || 'API_ERROR'
    };
  }
  
  return {
    message: 'An unknown error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR'
  };
};

export const createApiHeaders = (authToken?: string): Headers => {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  
  return headers;
};

export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const isApiLoading = (status: ApiStatus): boolean => {
  return status === 'loading';
};

export const isApiSuccess = (status: ApiStatus): boolean => {
  return status === 'success';
};

export const isApiError = (status: ApiStatus): boolean => {
  return status === 'error';
};

// Retry utility for failed API calls
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
};