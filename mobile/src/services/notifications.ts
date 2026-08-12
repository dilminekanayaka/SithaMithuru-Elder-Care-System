import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configures Android Notification Channels per es7.txt
 */
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medications", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284C7",
    });
    await Notifications.setNotificationChannelAsync("tasks", {
      name: "Daily Task Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync("emergency", {
      name: "Emergency & Safety Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: "#EF4444",
    });
  }
};

/**
 * Requests push notification permissions and retrieves the FCM/Expo registration token.
 * Registers the token with the backend database.
 * Gracefully catches errors to avoid crashes on emulators/unsupported environments.
 */
export const registerForPushNotificationsAsync = async (token: string): Promise<string | null> => {
  if (Platform.OS === "web") {
    console.log("Push notifications not supported on Web platform.");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("⚠️ Push notification permission was not granted by user.");
      return null;
    }

    // Get the device token. In Expo, this retrieves a token that resolves
    // to either FCM (Android) or APNs (iOS) through Expo's messaging service.
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const pushToken = tokenData.data;

    console.log(`📱 Retrieved Device Push Token: ${pushToken}`);

    // Register token with our backend
    await apiFetch("/users/fcm-token", token, {
      method: "POST",
      body: JSON.stringify({ fcm_token: pushToken }),
    });

    console.log("🚀 Registered device push token with SithaMithuru backend.");
    return pushToken;
  } catch (error: any) {
    console.warn(
      "⚠️ Push notification registration skipped: ",
      error.message || error
    );
    return null;
  }
};
