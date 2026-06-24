

import { axiosInstance } from './axios';
import axios from 'axios';

export class ApiError extends Error {
  status: number;
  info?: any;

  constructor(message: string, status: number, info?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.info = info;
  }
}

/**
 * Perform an authenticated HTTP request to the backend.
 * Uses axiosInstance internally and normalizes responses/errors.
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {};

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let data = options.body;
  if (data && typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Fallback if not valid JSON string
    }
  }

  try {
    const response = await axiosInstance({
      url: path,
      method,
      headers,
      data,
    });

    const json = response.data;

    // Handle 204 No Content
    if (response.status === 204 || !json) {
      return {} as T;
    }

    // If the server response contains pagination, map it to the standardized shape
    if (json && json.pagination) {
      const page = json.pagination.page ?? 1;
      const limit = json.pagination.limit ?? 20;
      const totalItems = json.pagination.total ?? 0;
      const totalPages = json.pagination.totalPages ?? 0;

      return {
        data: json.data ?? [],
        pagination: {
          page,
          limit,
          total_items: totalItems,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      } as unknown as T;
    }

    return json;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorInfo = error.response?.data || { error: 'Unknown server error' };
      throw new ApiError(
        errorInfo.error || errorInfo.message || `Request failed with status ${status}`,
        status,
        errorInfo
      );
    }
    throw new ApiError(error.message || 'Unknown network error', 500, { error: error.message });
  }
}

