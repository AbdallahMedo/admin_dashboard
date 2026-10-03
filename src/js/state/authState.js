// Auth State Management & Token Lifecycle Engine
const STORAGE_KEYS = {
  USER: 'admin_auth_user',
  ACCESS_TOKEN: 'admin_access_token',
  REFRESH_TOKEN: 'admin_refresh_token',
  EXPIRES_AT: 'admin_token_expires_at',
  BASE_URL: 'admin_api_base_url',
  MOCK_MODE: 'admin_use_mock_mode'
};

// Static hosting calls the Render API directly; VITE variables are public build configuration.
export const DEFAULT_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'https://design-more.onrender.com').replace(/\/+$/, '');

class AuthState {
  constructor() {
    this.user = this.getStoredJson(STORAGE_KEYS.USER, null);
    this.accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
    this.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
    this.accessTokenExpiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || null;
    
    // Check stored base URL or default to empty relative proxy
    const storedBaseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
    this.baseUrl = storedBaseUrl?.trim() || DEFAULT_BASE_URL;
    // Discard a development host saved before deployment.
    if (import.meta.env?.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(this.baseUrl)) this.baseUrl = DEFAULT_BASE_URL;
    
    // Always default to false: use real live backend and database!
    this.mockMode = false;
    localStorage.removeItem(STORAGE_KEYS.MOCK_MODE);

    this.listeners = new Set();
    this.refreshPromise = null;
  }

  getStoredJson(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }

  isAuthenticated() {
    return Boolean(this.accessToken && this.user);
  }

  isAdmin() {
    return this.user && (this.user.role === 'Admin' || this.user.role === 'admin');
  }

  setSession(data) {
    if (!data) return;
    if (data.user) {
      this.user = data.user;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    }
    if (data.accessToken) {
      this.accessToken = data.accessToken;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    }
    if (data.refreshToken) {
      this.refreshToken = data.refreshToken;
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    if (data.accessTokenExpiresAt) {
      this.accessTokenExpiresAt = data.accessTokenExpiresAt;
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.accessTokenExpiresAt);
    }
    this.notify();
  }

  updateTokens(accessToken, refreshToken, expiresAt) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (expiresAt) this.accessTokenExpiresAt = expiresAt;

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (expiresAt) localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt);
    this.notify();
  }

  clearSession() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.accessTokenExpiresAt = null;

    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    this.notify();
  }

  getBaseUrl() {
    return this.baseUrl || '';
  }

  setBaseUrl(url) {
    this.baseUrl = (url || '').trim().replace(/\/+$/, '') || DEFAULT_BASE_URL;
    localStorage.setItem(STORAGE_KEYS.BASE_URL, this.baseUrl);
    this.notify();
  }

  isMockMode() {
    return this.mockMode;
  }

  setMockMode(enabled) {
    this.mockMode = Boolean(enabled);
    this.notify();
  }

  isTokenExpired() {
    if (!this.accessTokenExpiresAt) return false;
    const expires = new Date(this.accessTokenExpiresAt).getTime();
    return Date.now() >= (expires - 30000); // 30s buffer
  }
}

export const authState = new AuthState();
