import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'sithamithuru_biometric_enabled';
const SAVED_CREDENTIALS_KEY = 'sithamithuru_saved_credentials';

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: string;
}

export class BiometricService {
  /**
   * Check if device supports Biometrics (Fingerprint / Face ID)
   */
  public async getBiometricStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = 'Biometrics';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Fingerprint';
      }

      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometricType,
      };
    } catch (error) {
      console.error('Biometric status error:', error);
      return { isAvailable: false, hasHardware: false, isEnrolled: false, biometricType: 'Biometrics' };
    }
  }

  /**
   * Authenticate User with Fingerprint / Face ID
   */
  public async authenticate(promptMessage: string = 'Authenticate to access SithaMithuru'): Promise<boolean> {
    try {
      const status = await this.getBiometricStatus();
      if (!status.isAvailable) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Store credentials for biometric login
   */
  public async saveBiometricCredentials(refreshToken: string, userData: any) {
    try {
      await SecureStore.setItemAsync(SAVED_CREDENTIALS_KEY, JSON.stringify({ refreshToken, userData }));
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('Failed to save biometric credentials:', error);
    }
  }

  /**
   * Get saved biometric credentials after successful biometric check
   */
  public async getSavedBiometricCredentials(): Promise<{ refreshToken: string; userData: any } | null> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (enabled !== 'true') return null;

      const json = await SecureStore.getItemAsync(SAVED_CREDENTIALS_KEY);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      return null;
    }
  }
}

export const biometricService = new BiometricService();
