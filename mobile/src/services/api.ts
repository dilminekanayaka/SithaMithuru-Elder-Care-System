import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace this with your computer's local IP address (e.g., cmd -> ipconfig -> IPv4 Address)
export const API_URL = 'http://192.168.1.106:5000/api/v1';

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
    token = await AsyncStorage.getItem('userToken');
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
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      try {
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync('sithamithuru_auth_token', data.token);
        await SecureStore.setItemAsync('sithamithuru_refresh_token', data.refreshToken);
      } catch {}
      
      // Retry original request with new token
      headers.set('Authorization', `Bearer ${data.token}`);
      response = await fetch(`${API_URL}${endpoint}`, { ...actualOptions, headers });
    } else {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
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
        throw new Error(json.error || json.message || 'API Request Failed');
      }
      
      // If there's pagination metadata, we might need to return it alongside data
      // For simplicity, we can attach meta to the data object or just return data if it's an object/array
      if (json.meta) {
        return { data: json.data, meta: json.meta }; // Special case where consumer needs to extract .data
      }
      
      return json.data;
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
