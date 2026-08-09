import { NativeModules, Platform } from 'react-native';

const { EmergencySOSModule } = NativeModules;

export interface EmergencySOSModuleInterface {
  startForegroundService(): Promise<boolean>;
  stopForegroundService(): Promise<boolean>;
}

export const emergencySOS: EmergencySOSModuleInterface = {
  startForegroundService: async () => {
    if (Platform.OS === 'android' && EmergencySOSModule) {
      try {
        return await EmergencySOSModule.startForegroundService();
      } catch (error) {
        console.error('Failed to start Emergency SOS Foreground Service:', error);
        return false;
      }
    }
    return false; // No-op on iOS or if module is missing
  },
  
  stopForegroundService: async () => {
    if (Platform.OS === 'android' && EmergencySOSModule) {
      try {
        return await EmergencySOSModule.stopForegroundService();
      } catch (error) {
        console.error('Failed to stop Emergency SOS Foreground Service:', error);
        return false;
      }
    }
    return false;
  }
};
