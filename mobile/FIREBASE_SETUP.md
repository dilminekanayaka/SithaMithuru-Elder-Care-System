# Firebase / `google-services.json` Setup

`google-services.json` is required at build time — `android/app/build.gradle`
applies the `com.google.gms.google-services` plugin and `app.json` references
this file — but it is **not** committed to git (it's a per-project secret,
now correctly listed in `.gitignore`). Without it, a fresh `git clone` cannot
build the Android app at all.

The file that was previously sitting in this directory contained entirely
fabricated placeholder values (`project_number: "123456789012"`,
`current_key: "AIzaSySithaMithuruDemoFirebaseApiKey123"`, etc.) — even if
present, push notifications silently would not have worked with it.

## To build locally

1. Go to the [Firebase Console](https://console.firebase.google.com/), open
   (or create) the project for this app.
2. Add an Android app with package name `com.sithamithuru` if not already
   registered.
3. Download the real `google-services.json` from Project Settings → Your apps.
4. Place it at `mobile/google-services.json` (same location as
   `google-services.json.example` in this directory, which shows the expected
   shape — do not commit the real file).

## For CI / EAS builds

Don't rely on a locally-placed file for CI. Instead:

- **EAS Build**: upload the real file as an EAS secret/asset and reference it
  from `eas.json`'s build profile (`"env"` + a config plugin, or EAS's
  file-secret mechanism), so it's injected at build time rather than
  committed.
- **Other CI**: inject it as a build-time secret file (e.g. decode a
  base64-encoded repo/CI secret into `mobile/google-services.json` as a
  pre-build step).

## Server-side (push notification delivery)

The backend has a separate, independent Firebase credential requirement —
see `backend/.env.example`'s `FIREBASE_CREDENTIALS` variable and
`backend/src/config/firebase.ts`. Both the mobile `google-services.json` and
the backend's service-account credential must point at the **same** Firebase
project for push notifications to actually deliver end-to-end.
