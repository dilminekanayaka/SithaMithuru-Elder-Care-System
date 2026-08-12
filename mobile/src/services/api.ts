import AsyncStorage from '@react-native-async-storage/async-storage';

declare const __DEV__: boolean | undefined;

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
// __DEV__ is the standard RN/Expo dev-vs-release-build flag. Fall back to
// NODE_ENV if it's ever unavailable (e.g. a non-RN test runner).
const isProductionBuild =
  typeof __DEV__ !== 'undefined' ? !__DEV__ : process.env.NODE_ENV === 'production';

if (isProductionBuild && (!configuredApiUrl || !configuredApiUrl.startsWith('https://'))) {
  // There is no real deployed production backend configured yet. Failing
  // loudly here — instead of silently falling back to localhost or a
  // placeholder domain — prevents shipping a release build that looks like
  // it works but can never reach a real server. Set EXPO_PUBLIC_API_URL in
  // mobile/.env.production to the real HTTPS backend URL once one exists.
  throw new Error(
    'EXPO_PUBLIC_API_URL is not configured for a production build. ' +
    'Set it to a real https:// backend URL in mobile/.env.production before building for production.'
  );
}

export const API_URL = (configuredApiUrl || 'http://localhost:5000/api/v1').replace(/\/$/, '');

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export const apiFetch = async (
  endpoint: string,
  tokenOrOptions?: string | RequestInit,
  options?: RequestInit
): Promise<any> => {
  let token: string | null = null;
  let actualOptions: RequestInit = {};

  if (typeof tokenOrOptions === 'string') {
    token = tokenOrOptions;
    actualOptions = options || {};
  } else if (tokenOrOptions) {
    actualOptions = tokenOrOptions;
  }

  if (!token) {
    try {
      const SecureStore = await import('expo-secure-store');
      token = await SecureStore.getItemAsync('sithamithuru_auth_token');
    } catch {}
  }

  const headers = new Headers(actualOptions.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...actualOptions,
    headers,
  });

  if (response.status === 401) {
    // Attempt token refresh
    let refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      try {
        const SecureStore = await import('expo-secure-store');
        refreshToken = await SecureStore.getItemAsync('sithamithuru_refresh_token');
      } catch {}
    }
    if (!refreshToken) {
      throw new SessionExpiredError();
    }

    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      try {
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync('sithamithuru_auth_token', data.token);
        await SecureStore.setItemAsync('sithamithuru_refresh_token', data.refreshToken);
      } catch {}
      
      // Retry original request with new token
      headers.set('Authorization', `Bearer ${data.token}`);
      response = await fetch(`${API_URL}${endpoint}`, { ...actualOptions, headers });
    } else {
      await AsyncStorage.removeItem('userData');
      try {
        const SecureStore = await import('expo-secure-store');
        await SecureStore.deleteItemAsync('sithamithuru_auth_token');
        await SecureStore.deleteItemAsync('sithamithuru_refresh_token');
        await SecureStore.deleteItemAsync('sithamithuru_user_data');
      } catch {}
      throw new SessionExpiredError();
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const json = await response.json();
    
    // Auto-unwrap for standardized API responses (Phase 13)
    if (json && typeof json === 'object' && 'success' in json) {
      if (!json.success) {
        const wrappedError = typeof json.error === 'string'
          ? json.error
          : json.error?.message;
        throw new Error(wrappedError || json.message || 'API Request Failed');
      }
      
      // If there's pagination metadata, we might need to return it alongside data
      // For simplicity, we can attach meta to the data object or just return data if it's an object/array
      if (json.meta) {
        return { data: json.data, meta: json.meta }; // Special case where consumer needs to extract .data
      }
      
      if ('data' in json && json.data !== undefined && json.data !== null) {
        return json.data;
      }

      const { success, meta, error, ...payload } = json;
      return payload;
    }
    
    // Legacy support for endpoints not yet using sendSuccess (like Auth)
    if (!response.ok) {
        throw new Error(json.message || json.error || 'API Request Failed');
    }
    return json;
  } else {
    return await response.text();
  }
};
