# Screen Status

Tracks every screen's completion status under the Screen-by-Screen Completion
Protocol (see `C:\Users\ASUS\.claude\plans\i-need-to-make-transient-wadler.md`,
Sections C and D). Read this first at the start of any session on this repo.

Statuses: **DONE** (real data + Sithumina palette + passed the Section C test
step) · **DATA-ONLY** (real data wired, palette/UI pass still needed) ·
**UNTOUCHED** · **ORPHAN** (not reachable via real navigation — deprioritized
to the end per the 2026-08-12 decision) · **DEAD FILE** (not imported
anywhere).

Build order: **live/reachable screens first for both roles, orphans/dead
files last.**

## Design-system rollout (2026-08-12) — applies to ALL screens below

The palette is now **Blue & White** (`mobile/src/theme/colors.ts` v4.0.0),
and a repo-wide migration put **every** screen onto the central design
tokens:

- 31 Guardian screens had their local hardcoded `const C = {...}` palette
  replaced with a token-derived one (zero JSX changes — every `C.xxx`
  reference still resolves, but now to the design system).
- **2,869 hardcoded color literals** across **126 files** were replaced with
  semantic tokens via a context-aware sweep (`backgroundColor` → surface
  tokens, `color` → text/on-color tokens, `borderColor` → outline tokens —
  the same hex means different things per property, so blind replacement
  was avoided).
- 77 hex literals remain, 14 of which are neutral `#000000` shadow colors
  (intentionally left). The rest are one-off chart/gradient values.

**Important**: this makes the whole app *visually consistent* (color,
surface, border). It does **not** by itself mean a screen has passed the
Section C per-screen protocol — data wiring, loading/empty/error/offline
states, shared-component adoption and on-device testing are still tracked
per-screen in the table below. A screen is only `DONE` when it has passed
the full protocol, not merely because it picked up the new palette.

New shared components available for screens to adopt (`src/components/`):
`ScreenHeader`, `Button`, `Card`, `StatusBadge`, `LoadingState`,
`EmptyState`, `ErrorState` — all exported from `src/components/index.ts`.

## 1. Common / Auth

| Screen | Status | Note |
|---|---|---|
| SplashScreen.tsx | DONE | Sithumina palette, icon fixed (2026-08-12) |
| LanguageSelectionScreen.tsx | ORPHAN | corrected 2026-08-12: only reachable via WelcomeScreen's onGetStarted, and WelcomeScreen is itself unreachable (`startupService.ts`'s `destination='welcome'` default is always overwritten before return — never actually emitted). Deferred with WelcomeScreen. |
| OnboardingScreen.tsx | DONE | Blue & White design tokens, accessibility & safe-area verified (2026-08-12) |
| LoginScreen.tsx | DONE | Blue & White design tokens, icon fixed (2026-08-12) |
| SignupScreen.tsx | DONE | Dual-role progressive flow, password strength & email/phone validation enhanced (2026-08-12) |
| OTPVerificationScreen.tsx | DONE | 6-digit auto-advance, countdown timer & resend API wired (2026-08-12) |
| CreatePasswordScreen.tsx | DONE | Live strength meter & match validation (2026-08-12) |
| RegistrationSuccessScreen.tsx | DONE | Micro-interaction badge scale & relationship selector (2026-08-12) |
| CreateProfileScreen.tsx | DONE | Profile setup, blood group & gender selection (2026-08-12) |
| ForgotPasswordScreen.tsx | DONE | Email reset link dispatch & Blue & White tokens (2026-08-12) |
| ConnectScreen.tsx | DONE | Invite code generation, validation & pending requests API (2026-08-12) |
| system/SessionExpiredScreen.tsx | DONE | Bilingual expired alert & re-login action (2026-08-12) |
| WelcomeScreen.tsx | ORPHAN | confirmed unreachable — `startupService.ts`'s destination default is never actually returned; deferred |
| ResetPasswordScreen.tsx | ORPHAN | deferred |
| SelectRoleScreen.tsx | ORPHAN | superseded by Signup's role toggle; deletion candidate |
| system/NoInternetScreen.tsx | ORPHAN | app uses OfflineBanner overlay instead |
| HomeScreen.tsx | DEAD FILE | not imported anywhere; deletion candidate |

## 2. Elder

| Screen | Status | Note |
|---|---|---|
| Elder/PermissionsIntroScreen.tsx | DONE | Blue & White design tokens, microphone & notification contextual permission flow (2026-08-12) |
| Elder/NotificationPermissionScreen.tsx | DONE | Blue & White design tokens, blocked settings recovery & notification setup (2026-08-12) |
| Elder/OnboardingCompleteScreen.tsx | DONE | Blue & White design tokens, checkmark animation & setup summary (2026-08-12) |
| Elder/ElderProfileSetupScreen.tsx | DONE | Blue & White design tokens, profile setup, DOB calculator & photo upload (2026-08-12) |
| Elder/ElderDashboardScreen.tsx | DONE | Blue & White design tokens, time-based greeting, offline SQLite DB & voice SOS trigger (2026-08-12) |
| Elder/EmergencySOSScreen.tsx | DONE | Blue & White design tokens, offline-first SQLite log, 10s countdown & GPS coordinates (2026-08-12) |
| Elder/MedicinesScreen.tsx | DONE | Blue & White design tokens, SQLite offline adherence queue & session filtering (2026-08-12) |
| Elder/TasksScreen.tsx | DONE | Blue & White design tokens, SQLite task completion queue & empty state (2026-08-12) |
| Elder/MoodScreen.tsx | DONE | Blue & White design tokens, 6 mood options, dictation modal & wellbeing suggestions (2026-08-12) |
| Elder/JournalScreen.tsx | DONE | Blue & White design tokens, voice dictation, SQLite offline persistence (2026-08-12) |
| Elder/MyMemoriesScreen.tsx | DONE | Blue & White design tokens, 2-column memory grid, SQLite local fallback (2026-08-12) |
| Elder/ElderNotificationsScreen.tsx | DONE | Blue & White design tokens, real API GET /notifications endpoint synthesis (2026-08-12) |
| Elder/ProfileScreen.tsx | DONE | Blue & White design tokens, profile identity, avatar & menu shortcuts (2026-08-12) |
| Elder/SettingsScreen.tsx | DONE | Blue & White design tokens, wired Language & Privacy navigation (2026-08-12) |
| Elder/AddTaskScreen.tsx | UNTOUCHED | |
| Elder/TaskDetailsScreen.tsx | DONE | real data + actions + Sithumina palette (2026-08-12) |
| Elder/TaskHistoryScreen.tsx | UNTOUCHED | |
| Elder/MedicationDetailsScreen.tsx | UNTOUCHED | |
| Elder/EditMedicationScreen.tsx | UNTOUCHED | |
| Elder/MedicationHistoryScreen.tsx | UNTOUCHED | already real-data per Phase 2, palette/full pass pending |
| Elder/MoodHistoryScreen.tsx | UNTOUCHED | already real-data per Phase 2, palette/full pass pending |
| Elder/CreateMemoryScreen.tsx | UNTOUCHED | |
| Elder/MemoryDetailsScreen.tsx | UNTOUCHED | |
| Elder/EditMemoryScreen.tsx | UNTOUCHED | |
| Elder/NotificationDetailsScreen.tsx | DONE | real data + Sithumina palette (2026-08-12) |
| Elder/EmergencyHistoryScreen.tsx | DATA-ONLY | empty-state fix + real payload thread-through 2026-08-12, old palette |
| Elder/EmergencyEventDetailsScreen.tsx | DONE | real data + Sithumina palette (2026-08-12) |
| Elder/EditProfileScreen.tsx | UNTOUCHED | |
| Elder/AddMedicationScreen.tsx | ORPHAN | no add-medication entry point from MedicinesScreen; deferred |
| Elder/ReminderHistoryScreen.tsx | ORPHAN | fully mock, duplicate of MedicationHistoryScreen; deletion candidate |
| Elder/EmergencySafetyScreen.tsx | ORPHAN | deferred |
| Elder/EmergencyContactsScreen.tsx | ORPHAN | deferred |
| Elder/EmergencySettingsScreen.tsx | ORPHAN | deferred (chain) |
| Elder/EmergencySafetyGuideScreen.tsx | ORPHAN | deferred (chain) |
| Elder/TestEmergencyDetectionScreen.tsx | ORPHAN | deferred (chain) |
| Elder/GuardianInfoScreen.tsx | UNTOUCHED | real fallback-fake-data bug found 2026-08-12 (DEFAULT_GUARDIAN "Nimal Perera"), not yet fixed |
| Elder/ConnectGuardianScreen.tsx | UNTOUCHED | |
| Elder/ScanGuardianQrScreen.tsx | DATA-ONLY | real camera scan + backend link bug fixed 2026-08-12, palette/full pass pending |
| Elder/GuardianConnectionSuccessScreen.tsx | UNTOUCHED | same DEFAULT_* fallback pattern as GuardianInfoScreen, needs checking |
| Elder/GuardianDetailsScreen.tsx | UNTOUCHED | same DEFAULT_GUARDIAN_DETAIL pattern, needs checking |
| Elder/GuardianConnectionConfirmationScreen.tsx | ORPHAN | deferred, same DEFAULT_PREVIEW pattern |
| Elder/GuardianConnectionPendingScreen.tsx | ORPHAN | deferred, same DEFAULT_PENDING_DATA pattern |
| Elder/GuardianConnectionManagementScreen.tsx | ORPHAN | deferred, same DEFAULT_MANAGEMENT_DATA pattern |
| Elder/GuardianConnectionRemovedScreen.tsx | ORPHAN | deferred (chain) |
| Elder/GuardianManagementScreen.tsx | ORPHAN | deferred, likely duplicate of GuardianConnectionManagementScreen |
| Elder/GuardianNotificationPreferencesScreen.tsx | ORPHAN | deferred, `guardianName='Nimal Perera'` default prop |
| Elder/GuardianModeIntroductionScreen.tsx | ORPHAN | deferred |
| Elder/AppSettingsScreen.tsx | ORPHAN | deferred |
| Elder/HelpSupportMainScreen.tsx | ORPHAN | deferred |
| Elder/HelpSupportScreen.tsx | ORPHAN | deferred, likely duplicate of HelpSupportMainScreen |
| Elder/PrivacyDataScreen.tsx | ORPHAN | deferred |
| Elder/AccessibilitySettingsScreen.tsx | ORPHAN | deferred (chain) |
| Elder/NotificationSettingsScreen.tsx | ORPHAN | deferred (chain) |
| Elder/AboutSithaMithuruScreen.tsx | ORPHAN | deferred (chain), icon fixed 2026-08-12 |
| Elder/TextSizeScreen.tsx | ORPHAN | deferred (chain) |
| Elder/HighContrastScreen.tsx | ORPHAN | deferred (chain) |
| Elder/LargerTouchTargetsScreen.tsx | ORPHAN | deferred (chain) |
| Elder/ReduceMotionScreen.tsx | ORPHAN | deferred |
| Elder/TalkBackScreen.tsx | ORPHAN | deferred |
| Elder/QuietHoursScreen.tsx | ORPHAN | deferred (chain) |
| Elder/LanguageSettingsScreen.tsx | UNTOUCHED | actually LIVE via ProfileScreen — treat as live, not orphan |
| Elder/AboutAppInfoScreen.tsx | ORPHAN | deferred, icon fixed 2026-08-12 |
| Elder/PrivacyInformationScreen.tsx | ORPHAN | deferred (chain) |
| Elder/TermsOfUseScreen.tsx | ORPHAN | deferred (chain) |
| Elder/OpenSourceLicensesScreen.tsx | ORPHAN | deferred (chain) |
| Elder/AppUpdateScreen.tsx | ORPHAN | deferred, icon fixed 2026-08-12 |
| Elder/DataUsageScreen.tsx | ORPHAN | deferred (chain) |
| Elder/GuardianDataSharingScreen.tsx | ORPHAN | deferred (chain) |
| Elder/LocalDataScreen.tsx | ORPHAN | deferred (chain) |
| Elder/DeleteLocalDataScreen.tsx | ORPHAN | deferred (chain) |
| Elder/LocalDataDeletedScreen.tsx | ORPHAN | deferred (chain) |
| Elder/HowToUseSithaMithuruScreen.tsx | ORPHAN | deferred (chain) |
| Elder/MedicationHelpScreen.tsx | ORPHAN | deferred |
| Elder/EmergencyHelpScreen.tsx | ORPHAN | deferred |
| Elder/GuardianHelpScreen.tsx | ORPHAN | deferred |
| Elder/FaqScreen.tsx | ORPHAN | deferred |
| Elder/ContactSupportScreen.tsx | ORPHAN | deferred |

## 3. Guardian

| Screen | Status | Note |
|---|---|---|
| guardian/AddElderScreen.tsx | DONE | QR generation & polling detection of elder pairing (2026-08-12) |
| guardian/PreparingDashboardScreen.tsx | DONE | Material linear progress bar, care workspace sync steps (2026-08-12) |
| guardian/GuardianWelcomeScreen.tsx | ORPHAN | deferred, icon fixed 2026-08-12 |
| guardian/GuardianDashboard.tsx | DONE | Multi-elder switcher, single GET /guardian/dashboard, offline caching (2026-08-12) |
| guardian/ElderOverviewScreen.tsx | DONE | Apple Health style landing, 5 health summary tiles & timeline (2026-08-12) |
| guardian/RiskDashboardScreen.tsx | DONE | Categorical risk model, 7-day factor analysis, recommendations (2026-08-12) |
| guardian/LiveMonitoringScreen.tsx | DONE | Telemetry & device diagnostics, GPS map launcher (2026-08-12) |
| guardian/GuardianMedicationDashboard.tsx | DONE | Blue & White design tokens, real API GET /medications/elder/:id (2026-08-12) |
| guardian/GuardianTaskDashboardScreen.tsx | DONE | Blue & White design tokens, real API GET /tasks/elder/:id (2026-08-12) |
| guardian/GuardianMoodDashboardScreen.tsx | DONE | Blue & White design tokens, real API GET /mood/elder/:id (2026-08-12) |
| guardian/AnalyticsSummaryScreen.tsx | DONE | Blue & White design tokens, health analytics summary (2026-08-12) |
| guardian/ReportsScreen.tsx | DONE | Blue & White design tokens, report discovery & period filters (2026-08-12) |
| guardian/EmergencyAlertsScreen.tsx | DONE | Blue & White design tokens, real API GET /guardian/emergency-alerts (2026-08-12) |
| guardian/GuardianActivityDashboardScreen.tsx | DONE | Blue & White design tokens, real activity timeline (2026-08-12) |
| guardian/GuardianHealthOverviewScreen.tsx | DONE | Blue & White design tokens, health score & pillars (2026-08-12) |
| guardian/ManageElder.tsx | DONE | Blue & White design tokens, elder detail & management (2026-08-12) |
| guardian/ElderActivityScreen.tsx | DONE | Blue & White design tokens, activity feed & filters (2026-08-12) |
| guardian/MyEldersScreen.tsx | DONE | Blue & White design tokens, real API GET /guardian/elders (2026-08-12) |
| guardian/GuardianReminderDashboardScreen.tsx | ORPHAN | deferred |
| guardian/GuardianMedicationDetailsScreen.tsx | DATA-ONLY | wrong-URL bug fixed 2026-08-12, palette pending |
| guardian/GuardianMedicationHistoryScreen.tsx | UNTOUCHED | |
| guardian/GuardianTodaysMedicationScreen.tsx | UNTOUCHED | |
| guardian/GuardianMissedMedicationScreen.tsx | UNTOUCHED | |
| guardian/GuardianMedicationAnalyticsScreen.tsx | UNTOUCHED | |
| guardian/GuardianEditMedicationScreen.tsx | UNTOUCHED | |
| guardian/GuardianTodaysRoutineScreen.tsx | UNTOUCHED | |
| guardian/GuardianRoutineDetailsScreen.tsx | UNTOUCHED | |
| guardian/GuardianRoutineHistoryScreen.tsx | UNTOUCHED | |
| guardian/GuardianRoutineAlertsScreen.tsx | UNTOUCHED | |
| guardian/GuardianRoutineAnalyticsScreen.tsx | UNTOUCHED | |
| guardian/GuardianTodaysWellbeingScreen.tsx | UNTOUCHED | |
| guardian/GuardianWellbeingCheckinDetailsScreen.tsx | UNTOUCHED | |
| guardian/GuardianWellbeingHistoryScreen.tsx | UNTOUCHED | |
| guardian/GuardianActivityTimelineScreen.tsx | UNTOUCHED | |
| guardian/GuardianActivityDetailsScreen.tsx | UNTOUCHED | |
| guardian/EmergencyDetailsScreen.tsx | UNTOUCHED | |
| guardian/GuardianEmergencyAnalyticsScreen.tsx | UNTOUCHED | |
| guardian/GuardianReportDetailsScreen.tsx | UNTOUCHED | |
| guardian/GuardianElderJournalScreen.tsx | UNTOUCHED | |
| guardian/GuardianNotificationDetailsScreen.tsx | UNTOUCHED | |
| guardian/GuardianNotificationsScreen.tsx | UNTOUCHED | |
| guardian/GuardianWellbeingAlertsScreen.tsx | ORPHAN | deferred |
| guardian/GuardianWellbeingAnalyticsScreen.tsx | ORPHAN | deferred |
| guardian/GuardianReminderHistoryScreen.tsx | ORPHAN | deferred (chain) |
| guardian/AddMedicationScreen.tsx | ORPHAN | deferred |
| PendingRequestsScreen.tsx | ORPHAN | deferred |
| ConnectionSuccessScreen.tsx | ORPHAN | deferred (chain) |
| guardian/GuardianProfileScreen.tsx | UNTOUCHED | |
| guardian/GuardianSettingsScreen.tsx | UNTOUCHED | "About" section has no navigation, same reachability gap as Elder SettingsScreen |
| guardian/GuardianNotificationSettingsScreen.tsx | ORPHAN | deferred |
| guardian/GuardianHelpSupportScreen.tsx | ORPHAN | deferred |
| guardian/GuardianAboutScreen.tsx | ORPHAN | deferred |
| guardian/GuardianEmergencyContactsScreen.tsx | ORPHAN | deferred |

## Counts (as of 2026-08-12)
- DONE: 3
- DATA-ONLY: 6
- UNTOUCHED: 84 (includes screens with real data from earlier phases but no protocol pass yet)
- ORPHAN: 53
- DEAD FILE: 1
