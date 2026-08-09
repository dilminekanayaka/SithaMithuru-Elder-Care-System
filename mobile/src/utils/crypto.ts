import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

const AES_KEY_ALIAS = 'sithamithuru_aes_key';

/**
 * Retrieves the AES-256 key from SecureStore. 
 * If it doesn't exist, it generates a new one.
 */
export const getAesKey = async (): Promise<string> => {
  try {
    let key = await SecureStore.getItemAsync(AES_KEY_ALIAS);
    if (!key) {
      // Generate a 256-bit (32 bytes) key
      key = CryptoJS.lib.WordArray.random(256 / 8).toString();
      await SecureStore.setItemAsync(AES_KEY_ALIAS, key);
    }
    return key;
  } catch (error) {
    console.error('Failed to access SecureStore for AES key', error);
    throw error;
  }
};

/**
 * Encrypts a string (e.g., JSON payload) using AES-256.
 */
export const encryptData = async (data: string): Promise<string> => {
  if (!data) return data;
  const key = await getAesKey();
  return CryptoJS.AES.encrypt(data, key).toString();
};

/**
 * Decrypts an AES-256 ciphertext back to the original string.
 */
export const decryptData = async (ciphertext: string): Promise<string> => {
  if (!ciphertext) return ciphertext;
  try {
    const key = await getAesKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext; // Fallback to raw if decryption fails (e.g., legacy unencrypted data)
  } catch (error) {
    console.warn('Failed to decrypt data, returning raw payload', error);
    return ciphertext;
  }
};
