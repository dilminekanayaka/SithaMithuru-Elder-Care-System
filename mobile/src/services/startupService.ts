/**
 * startupService.ts — Core Application Initializer & Startup Coordinator
 * Spec: es1.txt (ELDER-S01 — Splash Screen & App Startup)
 *
 * Principles:
 *  • FAST + CALM + TRUSTWORTHY + OFFLINE-FIRST
 *  • Bounded startup time (1-1.5s visual target)
 *  • Never block indefinitely waiting for network
 *  • Local session & database first
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { initDB } from '../database/db';
import { API_URL } from './api';
import { registerForPushNotificationsAsync } from './notifications';

export const STORE_TOKEN = 'sithamithuru_auth_token';
export const STORE_USER = 'sithamithuru_user_data';
export const STORE_REFRESH_TOKEN = 'sithamithuru_refresh_token';

export type StartupDestination =
  | 'elderDashboard'
  | 'guardianDashboard'
  | 'welcome'
  | 'onboarding'
  | 'login'
  | 'createProfile';

export interface StartupResult {
  destination: StartupDestination;
  user: any | null;
  token: string | null;
  role: 'Elder' | 'Guardian' | null;
  isOffline: boolean;
}

export type StartupStep =
  | 'INITIALIZING'
  | 'PREPARING_DATABASE'
  | 'CHECKING_SESSION'
  | 'CHECKING_PROFILE'
  | 'CHECKING_ONBOARDING'
  | 'READY'
  | 'ERROR';

/**
 * Executes startup sequence in accordance with ELDER-S01 spec.
 * Resolves destination and user context fast & reliably.
 */
export const initializeApplication = async (
  onStepChange?: (step: StartupStep) => void
): Promise<StartupResult> => {
  const startTime = Date.now();

  try {
    // Step 1: Preparing Local Database (SQLite)
    onStepChange?.('PREPARING_DATABASE');
    const dbOk = await initDB();
    if (!dbOk) {
      console.warn('⚠️ SQLite Database initialization failed, proceeding with fallback state.');
    }

    // Step 2: Checking Session & Authentication
    onStepChange?.('CHECKING_SESSION');
    let token = await SecureStore.getItemAsync(STORE_TOKEN);
    let userStr = await SecureStore.getItemAsync(STORE_USER);

    // Fallback to AsyncStorage for user metadata if needed
    if (!userStr) {
      userStr = await AsyncStorage.getItem('userData');
    }

    let user: any = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }

    // Step 3: Check network state for online validation
    onStepChange?.('CHECKING_PROFILE');
    const netState = await NetInfo.fetch();
    const isOnline = !!netState.isConnected && !!netState.isInternetReachable;

    let destination: StartupDestination = 'welcome';
    let validatedUser = user;
    let validatedToken = token;

    if (token && user && user.id) {
      const userRole = user.role === 'Guardian' ? 'Guardian' : 'Elder';

      if (isOnline) {
        // Online: Perform quick background re-validation with 2.5s timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(`${API_URL}/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const remoteUser = await res.json();
            validatedUser = { ...user, ...remoteUser };

            // Update local stored user
            await SecureStore.setItemAsync(STORE_USER, JSON.stringify(validatedUser));
            await AsyncStorage.setItem('userData', JSON.stringify(validatedUser));
          } else if (res.status === 401 || res.status === 403) {
            // Token revoked/expired -> Clear session
            await clearLocalSession();
            validatedUser = null;
            validatedToken = null;
            destination = 'login';
          }
        } catch (netErr) {
          // Network error or timeout during check: DO NOT clear session! Fall back to offline local state.
          console.log('ℹ️ Fast network session check timed out or failed, using local offline session.', netErr);
        }
      }

      if (validatedToken && validatedUser) {
        // Check Onboarding & Profile completeness
        onStepChange?.('CHECKING_ONBOARDING');
        if (validatedUser.profileCompleted === false) {
          destination = 'createProfile';
        } else {
          destination = validatedUser.role === 'Guardian' ? 'guardianDashboard' : 'elderDashboard';
        }

        // Register push notification in background
        registerForPushNotificationsAsync(validatedToken).catch(() => {});
      }
    } else {
      destination = 'onboarding';
    }

    // Ensure visual minimum time budget (~1.0s) for calm presentation
    const elapsed = Date.now() - startTime;
    const minVisualBudget = 1000;
    if (elapsed < minVisualBudget) {
      await new Promise((resolve) => setTimeout(resolve, minVisualBudget - elapsed));
    }

    onStepChange?.('READY');

    return {
      destination,
      user: validatedUser,
      token: validatedToken,
      role: validatedUser?.role === 'Guardian' ? 'Guardian' : 'Elder',
      isOffline: !isOnline,
    };
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    onStepChange?.('ERROR');
    throw error;
  }
};

/**
 * Clears local tokens and session cache securely.
 */
export const clearLocalSession = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORE_TOKEN);
    await SecureStore.deleteItemAsync(STORE_REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORE_USER);
    await AsyncStorage.removeItem('userData');
  } catch (err) {
    console.warn('Failed clearing session:', err);
  }
};
