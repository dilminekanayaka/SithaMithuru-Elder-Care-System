import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const isProduction = process.env.NODE_ENV === "production";
let isFirebaseInitialized = false;

// We look for either the environment variable or a default file in the root.
// FIREBASE_CREDENTIALS holds a path to the Admin SDK service-account JSON —
// never the credentials themselves — so nothing secret is ever hardcoded or
// committed to source (validateEnvironment() already requires this variable
// to be set before this module loads, when NODE_ENV=production).
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

// Production must never silently fall back to the console-log DEV FCM
// BYPASS below — a guardian who never receives a real emergency push
// because credentials were misconfigured is a safety issue, not a
// convenience issue. Fail the boot loudly instead.
if (isProduction && !isFirebaseInitialized) {
  console.error(
    "❌ FATAL: Firebase Admin SDK could not be initialized in production " +
    `(credentials path: '${credentialsPath}'). Real push notifications cannot ` +
    "be sent, and the DEV FCM BYPASS console-log fallback is disabled in " +
    "production. Set FIREBASE_CREDENTIALS to a valid service-account JSON path."
  );
  process.exit(1);
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
    if (isProduction) {
      // Should be unreachable — the module-load check above exits the
      // process if Firebase failed to initialize in production. Kept as a
      // defensive guard so a real push is never silently swapped for a
      // console.log in a live environment.
      console.error("❌ sendPushNotification called in production with Firebase uninitialized — refusing to bypass.");
      return;
    }
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
