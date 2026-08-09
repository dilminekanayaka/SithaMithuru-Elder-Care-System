import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

let isFirebaseInitialized = false;

// We look for either the environment variable or a default file in the root
const credentialsPath = process.env.FIREBASE_CREDENTIALS || path.join(process.cwd(), "firebase-service-account.json");

if (fs.existsSync(credentialsPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin:", error.message);
  }
} else {
  console.warn(
    `⚠️ Firebase Admin SDK was NOT initialized: credentials file not found at '${credentialsPath}'. ` +
    `FCM push notifications will be bypassed during development.`
  );
}

/**
 * Sends a push notification to a device token using Firebase Cloud Messaging (FCM).
 * Falls back to console logging if Firebase is not initialized.
 */
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!fcmToken) return;

  if (!isFirebaseInitialized) {
    console.log(
      `[DEV FCM BYPASS] To: ${fcmToken}\n` +
      `  Title: ${title}\n` +
      `  Body: ${body}\n` +
      `  Data: ${JSON.stringify(data)}`
    );
    return;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("📨 Successfully sent FCM message:", response);
  } catch (error: any) {
    console.error("❌ Error sending FCM push notification:", error.message);
  }
};
