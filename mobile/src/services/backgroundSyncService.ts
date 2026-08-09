import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from './syncService';

export const BACKGROUND_SYNC_TASK = 'SITHAMITHURU_BACKGROUND_SYNC';

/**
 * Background Task Definition for SithaMithuru Offline Queue Synchronization.
 * Executed by OS scheduler every 15 minutes when device has active WiFi/Cellular connectivity.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log(`⏰ [BackgroundSync] OS triggered background task: ${BACKGROUND_SYNC_TASK}`);

    // 1. Verify network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      console.log('📡 [BackgroundSync] Device offline; skipping sync.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 2. Retrieve credentials from storage
    const storedToken = await AsyncStorage.getItem('token');
    const storedUserStr = await AsyncStorage.getItem('user');
    if (!storedToken || !storedUserStr) {
      console.log('🔒 [BackgroundSync] No active user session stored.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const user = JSON.parse(storedUserStr);
    const elderId = user?.id;
    if (!elderId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // 3. Execute batched LWW synchronization
    const success = await syncService.syncOfflineQueue(elderId, storedToken);

    return success
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.Failed;
  } catch (error: any) {
    console.error('❌ [BackgroundSync] Execution error:', error.message || error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background synchronization task with expo-background-fetch.
 * Ensures offline actions sync silently even when the app is in the background or killed.
 */
export const registerBackgroundSync = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      console.log(`✅ [BackgroundSync] Task ${BACKGROUND_SYNC_TASK} is already registered.`);
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes interval
      stopOnTerminate: false,   // Continue after app terminates
      startOnBoot: true,        // Resume after device boot
    });

    console.log(`✅ [BackgroundSync] Successfully registered background task: ${BACKGROUND_SYNC_TASK}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ [BackgroundSync] Registration notice: ${error.message}`);
    return false;
  }
};

/**
 * Unregisters background sync task (e.g., on logout).
 */
export const unregisterBackgroundSync = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log(`🔌 [BackgroundSync] Unregistered task: ${BACKGROUND_SYNC_TASK}`);
  } catch (error) {
    // Ignore unregister error
  }
};
