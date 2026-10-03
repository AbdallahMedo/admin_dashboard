import { authState } from '../state/authState.js';
import { handleMockRequest } from './mockServer.js';

class ApiClient {
  constructor() {
    this.refreshPromise = null;
  }

  async request(path, options = {}) {
    const isMock = authState.isMockMode();
    const method = (options.method || 'GET').toUpperCase();
    const queryParams = options.params || {};

    // Only use mockServer if explicitly toggled ON by user
    if (isMock) {
      const response = await handleMockRequest(method, path, options.body, queryParams);
      if (response.status >= 400) {
        const err = new Error(response.data?.message || `Mock Error ${response.status}`);
        err.status = response.status;
        err.response = response.data;
        throw err;
      }
      return response.data;
    }

    // Live Backend API execution
    const baseUrl = authState.getBaseUrl();
    let queryString = '';
    if (Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, v);
        }
      }
      const qs = searchParams.toString();
      if (qs) queryString = '?' + qs;
    }

    // Relative path when baseUrl is empty string (routes through Vite proxy)
    const fullUrl = baseUrl ? `${baseUrl}${path}${queryString}` : `${path}${queryString}`;
    const headers = { ...options.headers };

    // Inject Bearer token
    if (authState.accessToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${authState.accessToken}`;
    }

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
      method,
      headers,
      body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
    };

    try {
      const response = await fetch(fullUrl, fetchOptions);

      // Handle 401 Unauthorized
      if (response.status === 401 && !options._retry && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshToken().catch(() => {
            authState.clearSession();
            window.location.hash = '#/login';
            throw new Error('Session expired. Please log in again.');
          }).finally(() => { this.refreshPromise = null; });
        }
        await this.refreshPromise;
        return this.request(path, { ...options, _retry: true });
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        window.location.hash = '#/forbidden';
        const err = new Error('Forbidden: Admin role required');
        err.status = 403;
        throw err;
      }

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = { message: `Request failed with status ${response.status}` };
        }
        const message = errData.message || (errData.errors ? Object.values(errData.errors).flat().join(', ') : `HTTP ${response.status}`);
        const err = new Error(message);
        err.status = response.status;
        err.response = errData;
        throw err;
      }

      // 204 No Content
      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();

    } catch (networkError) {
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        networkError.isNetworkConnectionError = true;
        networkError.message = `Cannot reach backend at ${fullUrl}. Check the API URL, server availability, and allowed origins (CORS).`;
      }
      throw networkError;
    }
  }

  async refreshToken() {
    const refreshToken = authState.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const baseUrl = authState.getBaseUrl();
    const url = baseUrl ? `${baseUrl}/api/auth/refresh` : '/api/auth/refresh';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Refresh token rotation failed');
    }

    const data = await response.json();
    authState.updateTokens(data.accessToken, data.refreshToken, data.accessTokenExpiresAt);
    return data;
  }
}

export const api = new ApiClient();
