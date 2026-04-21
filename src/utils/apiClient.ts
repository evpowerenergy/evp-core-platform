/**
 * API Client Utility
 * 
 * ทำไมต้องสร้างไฟล์นี้?
 * 1. แก้ปัญหา duplicate code - ไม่ต้องเขียน fetch logic ซ้ำกัน 89+ ครั้ง
 * 2. Single source of truth - จัดการ SUPABASE_URL และ auth token จากที่เดียว
 * 3. Consistent error handling - ใช้ error handling เดียวกันทั้งโปรเจกต์
 * 4. Easy to maintain - แก้ API logic ที่เดียวใช้ได้ทุกที่
 * 5. Type safety - ใช้ ApiResponse type สำหรับ responses
 * 
 * วิธีใช้:
 * ```typescript
 * import { createApiClient } from '@/utils/apiClient';
 * 
 * const api = await createApiClient();
 * const response = await api.get('core-leads-leads-list', { category: 'Package' });
 * if (response.success) {
 *   const leads = response.data;
 * }
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL } from '@/config';
import type { ApiResponse, ApiError, ApiRequestOptions } from '@/types';

/**
 * Get authentication token from Supabase session
 * 
 * ทำไมต้องแยก function นี้?
 * - Reusable: ใช้ได้ในหลายที่
 * - Error handling: จัดการ errors อย่างสม่ำเสมอ
 * - Type safety: return type ชัดเจน
 */
export async function getAuthToken(): Promise<string> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    
    if (!session?.access_token) {
      throw new Error('No authentication token available. Please login again.');
    }
    
    return session.access_token;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error getting auth token');
  }
}

/**
 * Build Edge Function URL
 * 
 * ทำไมต้องแยก function นี้?
 * - Centralized URL building logic
 * - Easy to change URL structure
 * - Type safe query parameters
 */
export function buildEdgeFunctionUrl(
  functionName: string,
  params?: Record<string, string | number | boolean>
): string {
  const baseUrl = SUPABASE_URL;
  
  if (!baseUrl) {
    throw new Error('SUPABASE_URL is not configured. Please check your environment variables.');
  }
  
  const url = new URL(`${baseUrl}/functions/v1/${functionName}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Standard error handler
 * 
 * ทำไมต้องมี error handler?
 * - Consistent error messages
 * - Better error categorization
 * - Easy to log errors centrally
 */
function handleApiError(error: unknown, url: string): ApiError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network error: Could not connect to server',
      code: 'NETWORK_ERROR',
      details: { url, originalError: error.message },
    };
  }
  
  if (error instanceof Error) {
    return {
      type: 'SERVER_ERROR',
      message: error.message,
      code: 'SERVER_ERROR',
      details: { url, originalError: error },
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: { url, originalError: error },
  };
}

/**
 * API Client class
 * 
 * ทำไมต้องใช้ class?
 * - Encapsulation: รวม logic ที่เกี่ยวข้องกัน
 * - State management: เก็บ auth token cache
 * - Method chaining: ใช้ได้สะดวก
 */
export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  
  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }
  
  /**
   * Update auth token (useful when token refreshes)
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  /**
   * GET request
   * 
   * ตัวอย่างการใช้งาน:
   * ```typescript
   * const response = await api.get('core-leads-leads-list', { category: 'Package' });
   * ```
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, { params, ...options });
  }
  
  /**
   * POST request
   * 
   * ตัวอย่างการใช้งาน:
   * ```typescript
   * const response = await api.post('core-leads-lead-mutations', { name: 'John' });
   * ```
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { body, ...options });
  }
  
  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { body, ...options });
  }
  
  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body, ...options });
  }
  
  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
  
  /**
   * Core request method
   * 
   * ทำไมต้องมี method นี้?
   * - Single implementation for all HTTP methods
   * - Consistent error handling
   * - Retry logic support
   * - Timeout handling
   */
  private async request<T = unknown>(
    method: ApiRequestOptions['method'],
    endpoint: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      timeout?: number;
      retry?: { attempts: number; delay: number };
    }
  ): Promise<ApiResponse<T>> {
    const url = options?.params 
      ? buildEdgeFunctionUrl(endpoint, options.params)
      : buildEdgeFunctionUrl(endpoint);
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    const requestOptions: RequestInit = {
      method,
      headers,
    };
    
    if (options?.body && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    // Retry logic
    const maxAttempts = options?.retry?.attempts || 1;
    const retryDelay = options?.retry?.delay || 1000;
    let lastError: ApiError | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Timeout handling
        const timeout = options?.timeout || 30000; // Default 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        requestOptions.signal = controller.signal;
        
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);
        
        // Parse response
        let data: unknown;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        // Handle errors
        if (!response.ok) {
          const errorMessage = typeof data === 'object' && data !== null && 'error' in data
            ? String((data as { error: unknown }).error)
            : `HTTP ${response.status}: ${response.statusText}`;
          
          return {
            success: false,
            error: errorMessage,
            message: errorMessage,
          };
        }
        
        // Return successful response
        if (typeof data === 'object' && data !== null && 'success' in data) {
          // If response is already ApiResponse format
          return data as ApiResponse<T>;
        }
        
        // Wrap raw data in ApiResponse
        return {
          success: true,
          data: data as T,
        };
      } catch (error) {
        lastError = handleApiError(error, url);
        
        // Don't retry on last attempt
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        return {
          success: false,
          error: lastError.message,
          message: lastError.message,
        };
      }
    }
    
    // This should never be reached, but TypeScript needs it
    return {
      success: false,
      error: lastError?.message || 'Request failed',
      message: lastError?.message || 'Request failed',
    };
  }
}

/**
 * Create API client instance
 * 
 * ทำไมต้องใช้ factory function?
 * - Async initialization: ต้อง get auth token ก่อน
 * - Error handling: จัดการ errors ตั้งแต่เริ่มต้น
 * - Convenience: ใช้งานง่าย
 * 
 * ตัวอย่างการใช้งาน:
 * ```typescript
 * const api = await createApiClient();
 * const response = await api.get('core-leads-leads-list');
 * ```
 */
export async function createApiClient(baseUrl?: string): Promise<ApiClient> {
  const url = baseUrl || SUPABASE_URL;
  
  if (!url) {
    throw new Error('SUPABASE_URL is not configured. Please check your environment variables.');
  }
  
  const token = await getAuthToken();
  
  return new ApiClient(url, token);
}

/**
 * Quick helper: Fetch with automatic auth
 * 
 * ทำไมต้องมี helper นี้?
 * - Quick requests: สำหรับใช้ครั้งเดียว
 * - Backward compatibility: ใช้แทน fetch() ได้เลย
 * 
 * ตัวอย่างการใช้งาน:
 * ```typescript
 * const response = await fetchWithAuth('core-leads-leads-list', { method: 'GET' });
 * ```
 */
export async function fetchWithAuth(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    params?: Record<string, string | number | boolean>;
  }
): Promise<Response> {
  const token = await getAuthToken();
  const url = buildEdgeFunctionUrl(endpoint, options?.params);
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers,
  };
  
  if (options?.body && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  return fetch(url, fetchOptions);
}

