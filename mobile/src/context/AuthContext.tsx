/**
 * AuthContext.tsx — SithaMithuru Guardian Authentication Architecture v1.0
 *
 * Central React Context Provider managing:
 *  • Security State Machine transitions (AuthStateType)
 *  • Encrypted storage persistence via SecureStore & AsyncStorage
 *  • Biometric enrollment & authentication via expo-local-authentication
 *  • Offline session restoration
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import { AuthStateType, canTransition } from '../services/authStateMachine';
import { API_URL } from '../services/api';

const STORE_TOKEN = 'sithamithuru_auth_token';
const STORE_REFRESH_TOKEN = 'sithamithuru_refresh_token';
const STORE_USER = 'sithamithuru_user_data';
const STORE_BIOMETRIC = 'sithamithuru_biometric_enabled';
const STORE_DEVICE_ID = 'sithamithuru_device_id';

interface AuthContextValue {
  authState: AuthStateType;
  user: any | null;
  token: string;
  refreshToken: string;
  isOnline: boolean;
  biometricEnabled: boolean;
  deviceId: string;
  login: (role: string, user: any, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  setAuthState: (state: AuthStateType) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthStateInternal] = useState<AuthStateType>('UNAUTHENTICATED');
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // State Transition Guard
  const setAuthState = useCallback((newState: AuthStateType) => {
    setAuthStateInternal((prev) => {
      if (prev === newState) return prev;
      if (canTransition(prev, newState)) {
        return newState;
      }
      // Force allow LOGGED_OUT / SESSION_EXPIRED override
      if (newState === 'LOGGED_OUT' || newState === 'SESSION_EXPIRED' || newState === 'UNAUTHENTICATED') {
        return newState;
      }
      return prev;
    });
  }, []);

  // Monitor Connectivity
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
    });
    return () => unsub();
  }, []);

  // Device ID Generator
  useEffect(() => {
    (async () => {
      try {
        let storedId = await SecureStore.getItemAsync(STORE_DEVICE_ID);
        if (!storedId) {
          storedId = `device_${Math.random().toString(36).substring(2, 10)}`;
          await SecureStore.setItemAsync(STORE_DEVICE_ID, storedId);
        }
        setDeviceId(storedId);

        const bio = await SecureStore.getItemAsync(STORE_BIOMETRIC);
        setBiometricEnabled(bio === 'true');
      } catch {}
    })();
  }, []);

  // Login handler
  const login = useCallback(
    async (role: string, userData: any, authToken: string, authRefreshToken: string) => {
      setUser(userData);
      setToken(authToken);
      setRefreshToken(authRefreshToken);

      await SecureStore.setItemAsync(STORE_TOKEN, authToken);
      await SecureStore.setItemAsync(STORE_REFRESH_TOKEN, authRefreshToken);
      await SecureStore.setItemAsync(STORE_USER, JSON.stringify({ ...userData, role }));

      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('refreshToken', authRefreshToken);
      await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, role }));

      setAuthState('ACTIVE');
    },
    [setAuthState]
  );

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(STORE_TOKEN);
      await SecureStore.deleteItemAsync(STORE_REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORE_USER);

      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
    } catch {}

    setUser(null);
    setToken('');
    setRefreshToken('');
    setAuthState('LOGGED_OUT');
  }, [setAuthState]);

  // Silent Token Refresh
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState('TOKEN_REFRESHING');
      let currentRefToken = refreshToken;
      if (!currentRefToken) {
        currentRefToken = (await SecureStore.getItemAsync(STORE_REFRESH_TOKEN)) || '';
      }
      if (!currentRefToken) {
        await logout();
        return false;
      }

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setRefreshToken(data.refreshToken);

        await SecureStore.setItemAsync(STORE_TOKEN, data.token);
        await SecureStore.setItemAsync(STORE_REFRESH_TOKEN, data.refreshToken);
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);

        setAuthState('ACTIVE');
        return true;
      } else {
        await logout();
        setAuthState('SESSION_EXPIRED');
        return false;
      }
    } catch {
      setAuthState('OFFLINE_AUTHENTICATED');
      return false;
    }
  }, [refreshToken, logout, setAuthState]);

  // Biometric Enrollment
  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Toast.show({ type: 'error', text1: 'Biometrics Unavailable', text2: 'No fingerprint or Face ID enrolled on this device.' });
        return false;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm fingerprint / Face Unlock for SithaMithuru',
        cancelLabel: 'Cancel',
      });

      if (res.success) {
        await SecureStore.setItemAsync(STORE_BIOMETRIC, 'true');
        setBiometricEnabled(true);
        Toast.show({ type: 'success', text1: 'Biometrics Enabled', text2: 'You can now use biometrics to sign in quickly.' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Biometric Authentication Trigger
  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SithaMithuru Guardian',
        cancelLabel: 'Use Password',
      });

      if (res.success) {
        setAuthState('ACTIVE');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [setAuthState]);

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        token,
        refreshToken,
        isOnline,
        biometricEnabled,
        deviceId,
        login,
        logout,
        refreshSession,
        enableBiometrics,
        authenticateWithBiometrics,
        setAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
