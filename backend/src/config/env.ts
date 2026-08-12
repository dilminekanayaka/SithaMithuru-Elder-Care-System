// Fails the process fast on boot if required production configuration is
// missing, instead of silently falling back to permissive CORS ("*"),
// dev-only defaults, or the Firebase DEV FCM BYPASS. Development is
// intentionally left permissive — this only tightens behavior when
// NODE_ENV=production.

export const isProduction = process.env.NODE_ENV === "production";

const PLACEHOLDER_VALUES = new Set([
  "change_me_to_a_long_random_string",
  "change_me_to_a_different_long_random_string",
  "yourpassword",
]);

export const validateEnvironment = (): void => {
  if (!isProduction) return;

  const missing: string[] = [];
  const insecure: string[] = [];

  const required = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_PORT",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGIN",
    "FIREBASE_CREDENTIALS",
  ];

  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(key);
    } else if (PLACEHOLDER_VALUES.has(value)) {
      insecure.push(key);
    }
  }

  if (process.env.CORS_ORIGIN === "*") {
    insecure.push("CORS_ORIGIN (must not be '*' in production)");
  }

  if (missing.length > 0 || insecure.length > 0) {
    console.error("❌ FATAL: invalid production environment configuration.");
    if (missing.length > 0) {
      console.error(`   Missing required variables: ${missing.join(", ")}`);
    }
    if (insecure.length > 0) {
      console.error(`   Insecure/placeholder values still in use: ${insecure.join(", ")}`);
    }
    console.error(
      "   Set real values for these in the production environment (see backend/.env.example) before starting the server."
    );
    process.exit(1);
  }
};
