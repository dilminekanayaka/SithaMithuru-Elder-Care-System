# Android Release Signing

The `release` build variant previously signed with the debug keystore (a
well-known, publicly-documented key — Google Play rejects builds signed with
it, and anyone with repo access could re-sign a malicious build identically).
This is now fixed: `app/build.gradle`'s `release` signing config reads the
real keystore from environment variables and fails the build loudly if
they're not set, instead of silently falling back to the debug key.

## The keystore

A release keystore (`sithamithuru-release.keystore`, PKCS12, RSA 2048,
valid until 2053) was generated on 2026-08-11 and handed to you outside the
repo — it must **never** be committed to git (`*.keystore` is now gitignored
as defense-in-depth, but treat the file itself as a secret regardless).

**Back this file up somewhere durable and access-controlled** (a password
manager's file-attachment feature, a secrets manager, an encrypted drive).
If you lose it, you can never publish an update to an app that's already on
the Play Store under this signing identity — Google Play permanently binds
an app's package name to its first release signature.

## Building a signed release locally

Set these four environment variables before running a release Gradle task
(values were provided to you separately, outside this repo):

```bash
export SITHAMITHURU_RELEASE_STORE_FILE="/absolute/path/to/sithamithuru-release.keystore"
export SITHAMITHURU_RELEASE_STORE_PASSWORD="..."
export SITHAMITHURU_RELEASE_KEY_ALIAS="sithamithuru-release"
export SITHAMITHURU_RELEASE_KEY_PASSWORD="..."   # same as store password — PKCS12 requires it

cd mobile/android
./gradlew bundleRelease   # AAB, for Play Store submission
# or: ./gradlew assembleRelease   # APK, for direct install/testing
```

On Windows PowerShell, use `$env:SITHAMITHURU_RELEASE_STORE_FILE = "..."` etc.

## Building via EAS

Add the same four values as EAS Secrets (`eas secret:create`) and reference
them from `mobile/eas.json`'s `production` build profile's `env` block using
the same variable names, or adapt to EAS's managed-credentials flow instead
(`eas credentials`) if you'd rather let EAS generate/hold the keystore for
you going forward — either is fine, but pick one source of truth so the
Play Store upload key doesn't fork into two different keystores.

## Verified 2026-08-11

A real `./gradlew assembleRelease` was run end-to-end in this environment
(SDK: build-tools 36.0.0/platform 37, Gradle-managed JDK 17) and succeeded
(`BUILD SUCCESSFUL`, `validateSigningRelease` passed). The resulting
`app-release.apk` was verified with `apksigner verify --print-certs`: its
signer certificate SHA-256 (`c745b5...ee681a9`) matches the release keystore
generated the same day — confirmed **not** signed with the debug key. The
APK's resource table also contains 9 bundled `.ttf` font files, matching
`react-native-vector-icons`'s font count, confirming icon fonts autolink
correctly (this had been an open, unverified risk before this build).

## Verifying after a release build

```bash
"$JAVA_HOME/bin/keytool" -list -v -keystore /path/to/sithamithuru-release.keystore
```

Confirm the SHA-1/SHA-256 fingerprint printed here matches what's registered
in Play Console under App Integrity, if/when Play App Signing is enabled.
