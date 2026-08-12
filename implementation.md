SithaMithuru — Industry-Standard Full-Stack Implementation Guide

Purpose: This document is the primary implementation instruction for Claude Sonnet 4.6.Read this entire README before changing the codebase. Do not start by randomly creating screens. First audit the existing repository, reconcile the existing implementation with the project requirements, establish the architecture/design system, and then implement the application end-to-end.

0. EXECUTION RULE

You are acting as a senior mobile architect, senior React Native/TypeScript engineer, senior Node.js/Express backend engineer, PostgreSQL/SQLite database engineer, security engineer, QA engineer, and product designer.

Your goal is not to produce a collection of disconnected screens.

Your goal is to turn the existing SithaMithuru repository into a cohesive, production-quality, maintainable Android application with:

consistent Elder Mode UI

separate Guardian authentication and navigation

complete frontend flows

complete backend APIs and business logic

PostgreSQL persistence

SQLite offline-first persistence

reliable synchronization

conflict handling

emergency keyword detection integration

Guardian notifications

role-based authorization

accessibility

Sinhala/Tamil/English localization

validation and error handling

automated testing

secure configuration

production-oriented project structure

CI/CD readiness

clear documentation

Do not optimize for speed by creating shortcuts that make the system harder to maintain.

1. PROJECT SOURCE OF TRUTH

The repository may contain older implementation decisions, older documentation, partial screens, or features that changed during the project.

Use the following priority order when deciding what to implement:

Current source code and actual working behavior

Latest approved SRS/project requirements supplied with the repository

Latest corrected project documentation

Existing database/schema/API contracts

Older reports and design documents

General engineering best practices

If two documents conflict:

do not silently invent a solution

identify the conflict

prefer the latest approved requirement

preserve already-working functionality unless it directly conflicts with the approved scope

document the decision in docs/DECISIONS.md

Never invent unsupported business requirements.

2. PROJECT CONTEXT

Product

SithaMithuru — Smart SOS and Well-Being Medication Assistant Mobile Application for Elders

The system is an elderly-care mobile platform designed around:

elderly-friendly interaction

emergency assistance

medication reminders

Guardian support

offline-first operation

multilingual usage

secure data synchronization

The documented architecture uses:

React Native mobile frontend

TypeScript

Node.js

Express.js

PostgreSQL

SQLite

TensorFlow Lite

Firebase Cloud Messaging (FCM)

JWT authentication

bcrypt password hashing

The application is designed as an offline-first mobile system, not as a cloud-only application.

3. PRIMARY ARCHITECTURAL PRINCIPLE

The application must NOT be designed as:

Mobile App
   ↓
Internet
   ↓
Backend
   ↓
Everything

The core architecture is:

                    LOCAL FIRST
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Medication        Tasks       Emergency
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       SQLite
                         │
                         ▼
                    Sync Queue
                         │
                    Internet?
                    /       \
                  NO         YES
                  │           │
              Continue       API
                              │
                              ▼
                           Backend
                         /         \
                        ▼           ▼
                  PostgreSQL       FCM
                                    │
                                    ▼
                                Guardian

Required behavior

When offline:

Elder must still be able to use core local features.

Medication schedules must remain locally available.

Local records must be saved in SQLite.

Emergency events must be recorded locally.

Pending changes must enter a sync queue.

The UI must not behave as though the entire application is broken.

When online:

synchronization must run safely

pending operations must be uploaded

remote changes must be downloaded

conflicts must be handled

synchronization status must be visible where appropriate

duplicate writes must be prevented

4. USER ROLES — CRITICAL

There are two distinct authenticated roles:

ELDER
GUARDIAN

They must have separate sessions, authorization rules, and navigation graphs.

NEVER implement:

Elder Mode
   ↓
Direct Guardian Dashboard

Instead:

                 Role Selection
                 /            \
                /              \
             Elder           Guardian
               ↓                ↓
         Elder Login      Guardian Login
               ↓                ↓
        Elder Dashboard   Guardian Dashboard

An Elder session must never be able to access Guardian-only API resources.

Backend authorization must enforce this, not only the frontend.

5. AUTHENTICATION ARCHITECTURE

Required concepts:

Authentication
Authorization
Role-based access control
Session handling
Secure token storage
Token expiry
Logout
Protected routes

JWT is the documented authentication mechanism.

Passwords must never be stored as plain text.

Use bcrypt or the project's approved secure password hashing mechanism.

Required frontend states

unauthenticated

authenticating

authenticated Elder

authenticated Guardian

session expired

authentication error

logout

offline session behavior, where supported by the approved security design

Required backend behavior

Every protected request must:

validate authentication token

identify the authenticated user

identify role

authorize the requested resource

enforce ownership/relationship rules

Do not rely on a client-provided role value.

6. ROLE-BASED DATA ACCESS

A Guardian may only access Elder information for an Elder who is explicitly linked/authorized.

A Guardian must not be able to:

query arbitrary Elder IDs

read unrelated Elder records

modify Elder data without explicit permission

access another Guardian's linked Elder

bypass relationship validation by changing an ID in the URL

Backend authorization must check ownership/relationship at the resource level.

Example:

GET /api/guardians/me/elders
GET /api/guardians/me/elders/:elderId

should validate that elderId is actually linked to the authenticated Guardian.

7. FRONTEND ARCHITECTURE

Use a maintainable feature-based architecture.

Recommended structure:

mobile/
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   │   ├── RootNavigator
│   │   │   ├── AuthNavigator
│   │   │   ├── ElderNavigator
│   │   │   └── GuardianNavigator
│   │   ├── providers/
│   │   ├── store/
│   │   └── bootstrap/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── elder/
│   │   │   ├── home/
│   │   │   ├── medication/
│   │   │   ├── safety/
│   │   │   ├── emergency/
│   │   │   ├── guardian/
│   │   │   ├── tasks/
│   │   │   ├── journal/
│   │   │   └── profile/
│   │   ├── guardian/
│   │   │   ├── dashboard/
│   │   │   ├── alerts/
│   │   │   ├── elder/
│   │   │   ├── medication/
│   │   │   └── emergency/
│   │   └── settings/
│   │
│   ├── core/
│   │   ├── api/
│   │   ├── database/
│   │   ├── sync/
│   │   ├── auth/
│   │   ├── notifications/
│   │   ├── emergency/
│   │   ├── permissions/
│   │   ├── storage/
│   │   ├── network/
│   │   ├── localization/
│   │   └── analytics/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── cards/
│   │   ├── navigation/
│   │   ├── feedback/
│   │   └── accessibility/
│   │
│   ├── design-system/
│   │   ├── colors
│   │   ├── typography
│   │   ├── spacing
│   │   ├── radius
│   │   ├── elevation
│   │   └── tokens
│   │
│   ├── i18n/
│   └── types/
│
├── assets/
├── tests/
└── package.json

Adapt this structure to the existing repository rather than destroying an already good architecture.

8. FRONTEND DESIGN SYSTEM — MANDATORY

The current application must not contain screens that look like unrelated products.

Create one SithaMithuru Design System and reuse it everywhere.

Global rules

Every normal screen must use:

the same typography scale

the same spacing scale

the same colors

the same button styles

the same card styles

the same list-row styles

the same icon family

the same app-bar behavior

the same bottom-navigation behavior

the same dialog behavior

the same snackbar/feedback behavior

the same loading/error/empty states

the same accessibility rules

Do not create one-off UI components when an existing reusable component can be used.

9. ELDER MODE NAVIGATION

Elder Mode must have a stable navigation shell.

Recommended top-level destinations:

Home
Medicines
Safety
More

Example:

┌─────────────────────────────────────┐
│                                     │
│             SCREEN CONTENT          │
│                                     │
├─────────────────────────────────────┤
│ Home  Medicines  Safety  More       │
└─────────────────────────────────────┘

Important

Bottom navigation is for top-level destinations only.

Secondary screens should normally use:

← Screen Title

rather than introducing a different navigation pattern.

Do not randomly change navigation between screens.

10. GUARDIAN MODE NAVIGATION

Guardian Mode must have its own navigation shell.

Recommended:

Overview
Alerts
Elder
More

Guardian Mode and Elder Mode share the same global design system but have different role-specific navigation.

11. EMERGENCY NAVIGATION EXCEPTION

Emergency screens are safety-critical.

Do not show normal bottom navigation during an active emergency workflow.

Emergency flow:

Normal App
    ↓
Emergency Detected
    ↓
Full-Screen Emergency State
    ↓
Countdown
    ↓
Cancel / Continue
    ↓
Emergency Result

The Elder must never need to navigate through multiple normal screens to confirm or cancel an emergency.

12. SCREEN DESIGN TEMPLATE

Every new screen must be specified and implemented using this structure:

Screen ID
Screen Name
Purpose
User Role
Entry Points
Exit Points
Navigation
App Bar
Bottom Navigation
Content Hierarchy
Components
Primary CTA
Secondary CTA
Loading State
Empty State
Error State
Offline State
Sync State
Validation
Accessibility
Localization
Security
Edge Cases
Acceptance Criteria

Do not create screens without considering their states.

13. ELDER UX PRINCIPLES

Elder Mode must prioritize:

large typography

large touch targets

high contrast

simple language

minimal choices

clear icons plus text

predictable navigation

strong visual hierarchy

calm layouts

minimal cognitive load

no unnecessary animations

clear confirmation for destructive actions

Avoid:

tiny controls

dense tables

complex menus

icon-only critical actions

long technical messages

excessive decorative UI

inconsistent layouts

hidden important actions

14. ACCESSIBILITY

Every Elder screen must support:

Large Typography
Dynamic text scaling
Large Touch Targets
High Contrast
TalkBack
Semantic labels
Logical focus order
Reduce Motion
Readable error messages

Interactive targets should generally be at least 48dp, with 56–64dp preferred for important Elder actions.

Do not rely on color alone for:

risk level

errors

success

emergency state

selected state

15. LOCALIZATION

Support:

English
සිංහල
தமிழ்

Do not hard-code user-visible strings in components.

Use a centralized localization system.

Translations must cover:

buttons

headings

descriptions

validation messages

errors

notifications

dialogs

accessibility labels

empty states

offline messages

Do not mix English and translated strings on the same screen unless the product requirement explicitly requires it.

16. OFFLINE-FIRST UI STATES

Relevant screens must distinguish:

Online
Offline
Syncing
Synced
Sync Failed
Stale Data

Preferred Elder-facing language:

Offline
Your information is saved on this device.

or:

Some information is still syncing.

Do not display technical errors such as:

HTTP 503
SQLiteException
NetworkError
AxiosError

to Elder users.

17. CENTRALIZED APPLICATION STATE

The app should be able to determine centrally:

Authenticated?
Current role?
Guardian connected?
Internet available?
Emergency detector ready?
Today's medication?
Today's tasks?
Current mood?
Current safety level?
Pending sync operations?
Last synchronization time?

Do not duplicate these states independently across many screens.

Use centralized state management appropriate to the existing project.

18. LOCAL DATABASE — SQLITE

SQLite is the primary local relational store for offline operation.

Use it for appropriate local data such as:

user/profile state required for offline operation

medication schedules

medication logs

daily tasks

task logs

journal entries

mood records

emergency records

notification state

sync queue

sync metadata

Use migrations.

Never change production database schema without a migration.

19. LOCAL DATABASE RULES

Every syncable entity should have a reliable synchronization strategy.

Recommended metadata:

id
serverId
createdAt
updatedAt
deletedAt
syncStatus
version
deviceId

Adapt to the existing schema and approved requirements.

Do not duplicate server and local IDs without a clear reason.

20. POSTGRESQL

PostgreSQL is the cloud/source-of-record database for synchronized data.

The documented domain includes entities such as:

User
Guardian
Medication
MedicationLog
DailyTask
TaskLog
JournalEntry
MoodLog
EmergencyLog
RiskAssessment
Notification

Use the actual approved schema in the repository as the final source of truth.

21. DATABASE ENGINEERING REQUIREMENTS

Use:

primary keys

foreign keys

unique constraints

check constraints where appropriate

indexes

timestamps

transactions

normalized relationships

explicit deletion behavior

migrations

seed data for development/test environments

Do not rely only on frontend validation.

22. BACKEND ARCHITECTURE

Recommended:

backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── validators/
│   ├── auth/
│   ├── sync/
│   ├── notifications/
│   ├── database/
│   ├── errors/
│   ├── utils/
│   └── types/
│
├── migrations/
├── seeds/
├── tests/
└── package.json

Use clear separation:

Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Database

Controllers should not contain large amounts of business logic.

23. API DESIGN

Use RESTful APIs.

Suggested resource groups:

/api/auth
/api/users
/api/elders
/api/guardians
/api/medications
/api/medication-logs
/api/tasks
/api/task-logs
/api/journal
/api/moods
/api/emergencies
/api/risks
/api/notifications
/api/sync

Do not blindly create every endpoint. Use the actual domain and existing API contracts.

24. API REQUIREMENTS

Every endpoint must have:

authentication requirement

authorization requirement

input validation

predictable response shape

error handling

appropriate HTTP status

logging where appropriate

pagination for potentially large collections

ownership checks

transaction handling where required

Never trust IDs or roles supplied by the client.

25. API ERROR FORMAT

Use one consistent format.

Example:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the entered information.",
    "details": []
  },
  "requestId": "..."
}

Do not expose stack traces or database errors in production responses.

26. VALIDATION

Validate on both sides:

Frontend
+
Backend
+
Database constraints

Backend validation is mandatory.

Use the project's existing validation library if appropriate.

27. SECURITY REQUIREMENTS

Because the application handles personal and healthcare-related information:

Implement:

bcrypt password hashing

JWT authentication

role-based authorization

ownership checks

secure token storage

HTTPS in non-local environments

environment variables for secrets

no secrets committed to Git

rate limiting on sensitive endpoints

input validation

safe error responses

CORS configuration

security headers

audit logging for sensitive operations

secure logout/session invalidation strategy

least-privilege access

database constraints

Never log:

passwords

JWTs

raw authorization headers

sensitive health information

raw voice recordings

28. ENVIRONMENT VARIABLES

Never hard-code:

database passwords
JWT secrets
Firebase credentials
API keys
production URLs
support secrets

Use:

.env
.env.example

and document all required variables.

.env must be in .gitignore.

29. EMERGENCY KEYWORD DETECTION

Emergency detection is one of the most safety-critical modules.

The approved architecture uses TensorFlow Lite for on-device keyword detection.

The model should operate locally rather than sending continuous raw audio to a server.

High-level flow:

Microphone
    ↓
Audio preprocessing
    ↓
Keyword detector
    ↓
Emergency keyword
    ↓
Emergency workflow
    ↓
Countdown / confirmation
    ↓
Emergency event
    ↓
Local persistence
    ↓
Guardian notification when required

Do not move continuous audio processing to the backend.

30. EMERGENCY PERFORMANCE

The documented target is approximately:

< 1 second inference target

Optimize for:

low latency

low battery use

on-device processing

memory efficiency

correct lifecycle management

microphone permission handling

false-positive handling

false-negative evaluation

background behavior compatible with Android restrictions

Do not claim perfect detection accuracy.

31. EMERGENCY UX

Emergency UI must be visually distinct.

Required concepts:

Emergency detected
Countdown
Cancel
Confirm / Continue
Emergency recorded
Guardian notification state

Avoid unnecessary navigation during the emergency workflow.

32. EMERGENCY DATA SAFETY

When an emergency is confirmed:

create an emergency event locally

persist it before attempting remote delivery

add it to the sync queue if needed

attempt notification delivery when possible

preserve the event if network delivery fails

synchronize later

Emergency sync priority must be the highest priority.

Recommended sync priorities:

CRITICAL
HIGH
NORMAL
LOW

Emergency events are CRITICAL.

33. GUARDIAN NOTIFICATIONS

Firebase Cloud Messaging is the documented push notification mechanism.

Use notifications for relevant events such as:

confirmed emergency

meaningful safety concerns

approved medication-related alerts

other approved Guardian events

Do not notify the Guardian for every raw event if the product requirement is context-aware monitoring.

34. CONTEXT-AWARE RISK ENGINE

The Guardian system should not behave like a raw event-forwarding system.

Conceptually:

Medication events
Safety events
Emergency events
Activity signals
       ↓
Risk evaluation
       ↓
Green / Yellow / Red
       ↓
Guardian action when appropriate

Do not expose internal numerical thresholds to Elder-facing screens.

The UI should communicate the meaning of the state, not implementation details.

35. RISK LEVELS

Use consistent semantics:

GREEN
No immediate concern

YELLOW
Attention may be needed

RED
Immediate attention needed

Never communicate risk only by color.

36. GUARDIAN DASHBOARD

Guardian Dashboard should prioritize:

active emergency

red/high-risk concerns

yellow concerns

medication concerns

general information

Show:

Elder identity

current safety status

important alerts

medication summary

safety summary

emergency summary

last synchronized time

If data is stale, make this visible.

Do not present stale data as current.

37. GUARDIAN PRIVACY

Guardian Mode must not be designed as unrestricted surveillance.

Do not add unsupported features such as:

remote camera

remote microphone

live location

remote device control

hidden monitoring

unrestricted health history

unless explicitly approved by project requirements.

38. MEDICATION MODULE

The medication module must support the approved workflow.

Potential domain:

Medication
Medication Schedule
Medication Log
Reminder

Core behavior:

Schedule
   ↓
Local reminder
   ↓
Elder action
   ↓
Local log
   ↓
Risk analysis / sync where applicable

Do not claim the application physically verifies that medication was swallowed.

The system records the user's configured action/confirmation.

39. DAILY TASK / JOURNAL / MOOD MODULES

Existing project documentation includes Daily Tasks and Mood/Journal functionality.

If these modules exist in the current repository or are part of the latest approved requirements:

preserve them

make them consistent with the design system

make them offline-first

synchronize them safely

include them in testing

If the latest approved SRS explicitly removed a feature, do not reintroduce it merely because an older document mentions it.

When a scope conflict exists, document the decision in:

docs/DECISIONS.md

40. GUARDIAN PAIRING

The documented project includes account linking/invitation-code behavior.

A safe flow is:

Elder
  ↓
Generate / display pairing code
  ↓
Guardian enters code
  ↓
Backend validates code
  ↓
Relationship created
  ↓
Permissions established

Pairing codes must:

expire

be single-use where appropriate

be securely generated

not expose unnecessary account data

be validated server-side

41. SYNC ENGINE

Create a dedicated sync module.

Recommended:

core/sync/
├── SyncManager
├── SyncQueue
├── SyncWorker
├── ConflictResolver
├── SyncCursor
└── SyncStatus

Responsibilities:

SyncManager

Coordinates synchronization.

SyncQueue

Stores pending operations.

SyncWorker

Executes sync when conditions allow.

ConflictResolver

Handles conflicting local/remote changes.

SyncCursor

Tracks incremental synchronization where supported.

SyncStatus

Exposes:

Idle
Syncing
Synced
Partial
Failed
Offline

42. SYNC CONFLICTS

Do not use:

Last write wins

blindly for every entity.

Define conflict policy per entity.

Example:

Medication schedule
→ explicit conflict review / deterministic policy

Journal entry
→ immutable append-style records where possible

Emergency event
→ never silently discard

Notification state
→ deterministic merge

Profile settings
→ documented preference policy

The final policy must be documented.

43. IDEMPOTENCY

Sync operations must be safe to retry.

Use idempotency keys or stable operation IDs where appropriate.

A network retry must not create:

duplicate medication
duplicate journal entry
duplicate emergency event
duplicate task

44. PAGINATION

Do not load unlimited historical data into memory.

Use pagination for:

journal history

medication history

task history

emergency history

Guardian alerts

notifications

Use infinite scrolling or explicit pagination as appropriate.

45. DATABASE INDEXING

Review query patterns and create indexes for:

user identifiers

Guardian/Elder relationships

medication schedules

event timestamps

notification status

sync status

emergency timestamps

risk records

Do not add indexes blindly; verify query usage.

46. PERFORMANCE

Target:

fast local reads

responsive navigation

low memory usage

efficient list rendering

minimal unnecessary API calls

efficient SQLite queries

background synchronization

low battery impact

optimized TensorFlow Lite inference

Avoid:

rendering huge arrays without virtualization

unnecessary global state updates

duplicate network calls

blocking UI with database work

repeated full synchronization

47. ERROR HANDLING

Every feature must handle:

Validation error
Network error
Authentication error
Authorization error
Database error
Sync conflict
Timeout
Offline state
Empty state
Unexpected server response

User-facing errors must be simple.

Developer-facing logs must contain enough context for debugging without leaking secrets.

48. LOGGING

Use structured logs.

Example fields:

timestamp
level
module
event
requestId
userId
role

Never log:

password
JWT
raw audio
sensitive medical details

in normal application logs.

49. OBSERVABILITY

For backend:

request IDs

structured logs

health endpoint

error monitoring

database health

notification failures

sync failures

For mobile:

controlled error reporting

crash reporting if approved

sync diagnostics

emergency workflow diagnostics without recording sensitive audio

50. TESTING STRATEGY

Implement:

Unit Tests
Integration Tests
UI Tests
End-to-End Tests
Offline Tests
Sync Tests
Security Tests
Accessibility Tests
Performance Tests
Emergency/ML Tests

51. UNIT TESTS

At minimum test:

authentication

authorization rules

medication logic

task logic if present

journal logic if present

emergency event creation

risk calculation

sync queue

conflict resolution

local database repositories

validation

notification payload creation

52. INTEGRATION TESTS

Test interactions between:

React Native
↓
REST API
↓
PostgreSQL

and:

React Native
↓
SQLite
↓
Sync Queue
↓
Backend
↓
PostgreSQL

and:

Emergency Detection
↓
Emergency Event
↓
Backend
↓
FCM
↓
Guardian

53. OFFLINE TEST MATRIX

Test:

Online
Offline before creating data
Offline while editing data
Network lost during sync
Network restored during sync
Duplicate retry
Conflict
Partial sync
Server unavailable
FCM unavailable

The app must not lose locally saved critical information.

54. SECURITY TEST MATRIX

Test:

Invalid JWT
Expired JWT
Wrong role
Wrong Elder ID
Unlinked Guardian
Unauthorized modification
SQL injection attempts
Malformed input
Rate limiting
Password policy
Token storage
Logout
Session expiry

55. EMERGENCY TEST MATRIX

Test:

Keyword detected
False detection
Cancellation
Confirmation
Offline detection
Network loss after confirmation
Network restoration
Duplicate event prevention
Guardian notification
FCM failure
App lifecycle edge cases
Permission denied
Microphone unavailable
Low battery

56. ACCESSIBILITY TESTING

Verify:

TalkBack
Large text
Dynamic font scaling
High contrast
Touch target sizes
Focus order
Content descriptions
Keyboard/external navigation where relevant
Reduced motion

57. UI CONSISTENCY CHECKLIST

Before considering the frontend complete, verify every screen:

[ ] Same app bar rules
[ ] Same back button
[ ] Same typography
[ ] Same spacing
[ ] Same button components
[ ] Same card components
[ ] Same icons
[ ] Same colors
[ ] Same bottom navigation
[ ] Same loading states
[ ] Same error states
[ ] Same empty states
[ ] Same offline states
[ ] Same accessibility behavior
[ ] Same localization behavior

58. DESIGN SYSTEM TOKENS

Define central tokens rather than scattering raw values throughout the code.

Example:

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

Also centralize:

colors
typography
radius
elevation
dimensions
touch targets
animation durations

Use the project's existing visual identity if already established.

Do not arbitrarily redesign the brand.

59. COMPONENT LIBRARY

Create/reuse components such as:

AppBar
BottomNavigation
PrimaryButton
SecondaryButton
DangerButton
TextInput
PasswordInput
ListItem
Card
StatusCard
RiskCard
MedicationCard
AlertCard
EmptyState
ErrorState
LoadingState
OfflineBanner
SyncIndicator
ConfirmationDialog
BottomSheet
SectionHeader

Avoid duplicate versions such as:

MedicationCardV1
MedicationCardNew
MedicationCardFinal
MedicationCardFinal2

Refactor into one reusable component.

60. FRONTEND CODE QUALITY

Use TypeScript strictly.

Prefer:

explicit types
small components
feature boundaries
pure business logic
testable services
reusable hooks

Avoid:

any
large monolithic screens
business logic inside JSX
API calls directly inside presentation components
duplicate validation
magic strings
magic numbers

61. BACKEND CODE QUALITY

Use:

TypeScript
strict mode
typed request/response models
central error middleware
service/repository separation
schema validation
database migrations
transactions
unit tests
integration tests

Avoid:

any
fat controllers
SQL scattered through routes
hard-coded credentials
duplicated authorization logic

62. API DOCUMENTATION

Create:

docs/API.md

Document:

authentication

endpoints

request bodies

response bodies

errors

authorization

pagination

sync behavior

If practical, generate an OpenAPI specification.

63. DATABASE DOCUMENTATION

Create:

docs/DATABASE.md

Include:

tables

relationships

indexes

migrations

sync metadata

conflict strategy

deletion strategy

64. ARCHITECTURE DOCUMENTATION

Create:

docs/ARCHITECTURE.md

Include:

Mobile
Local Database
Sync
Backend
PostgreSQL
ML
FCM
Authentication
Guardian relationship

65. DECISION LOG

Create:

docs/DECISIONS.md

Whenever the repository contains conflicting requirements, record:

Decision
Reason
Source
Impact
Date

Do not silently resolve major conflicts.

66. README / PROJECT DOCUMENTATION

The root README should explain:

Project overview
Features
Architecture
Tech stack
Repository structure
Environment setup
Database setup
Mobile setup
Backend setup
Firebase setup
ML model setup
Running locally
Testing
Building
Deployment
Troubleshooting
Security
Offline synchronization

67. ENVIRONMENT SETUP

Create examples such as:

mobile/.env.example
backend/.env.example

Never commit actual secrets.

Document:

API URL
DATABASE URL
JWT secret
Firebase configuration
other approved environment variables

68. DEVELOPMENT ENVIRONMENTS

Support clear separation:

development
staging
production

Do not point local development at production databases.

69. DATABASE MIGRATIONS

Use migrations for PostgreSQL.

Use versioned migrations for SQLite.

Never instruct developers to manually edit production tables.

70. SEED DATA

Create development seed data for:

test Elder

test Guardian

medication

sample task if applicable

sample notification

sample risk state

sample emergency record

Never use real personal/health data in seed scripts.

71. CI/CD

Prepare the repository for CI/CD.

Pipeline stages:

Install
↓
Lint
↓
Typecheck
↓
Unit tests
↓
Integration tests
↓
Build
↓
Security checks

For deployment:

Development
↓
Staging
↓
Production

Mobile builds should support signed Android artifacts.

72. ANDROID BUILD

The project should produce:

Debug APK
Release APK
AAB

Production release should use secure signing configuration.

Never commit private signing keys.

73. FIREBASE

FCM configuration must be environment-safe.

Do not commit secrets or private credentials.

Document:

Firebase project configuration

Android package/application ID

notification permissions

notification channels

token registration

token refresh

logout token cleanup

notification handling in foreground/background/terminated states

74. NOTIFICATION STATES

Test:

Foreground
Background
Terminated
Offline
Token refreshed
User logged out
User logged into another role

A logged-out Guardian must not continue receiving protected notifications through stale application state.

75. PERMISSIONS

Handle permissions explicitly:

Microphone
Notifications
Other required Android permissions

For every permission:

explain why it is needed

handle denied state

handle permanently denied state

provide a path to Android settings when appropriate

never crash when permission is denied

76. PRIVACY

The emergency voice feature should process audio locally according to the approved architecture.

Do not upload continuous raw audio to the backend unless explicitly required by the approved requirements.

Document:

What data is collected
Why it is collected
Where it is stored
How it is synchronized
Who can access it
How it is deleted

77. DATA DELETION

Deletion must be carefully designed.

Consider:

Local deletion
Cloud deletion
Sync queue deletion
Guardian access
Audit requirements

Do not silently delete cloud records when the user only intended to clear local cache.

78. SECURITY OF LOCAL STORAGE

Sensitive local values such as authentication tokens should use secure device storage rather than plain SQLite or plain AsyncStorage.

Use the project's approved secure-storage library.

Do not store raw passwords.

79. NETWORK SECURITY

Use HTTPS outside local development.

Configure:

TLS
API base URL
certificate/security policy where appropriate
timeouts
retry strategy

Do not retry emergency operations blindly without idempotency.

80. RETRY STRATEGY

Normal data:

limited exponential backoff

Emergency:

high priority
persistent local record
controlled retry
no duplicate event creation

Do not implement infinite aggressive retries that drain battery.

81. BATTERY

The emergency detector is expected to operate efficiently.

Avoid unnecessary continuous:

network polling
database polling
UI polling

Prefer:

event-driven updates
background work
push notifications
network-aware sync

where Android permits.

82. BACKGROUND EXECUTION

Respect modern Android background execution restrictions.

Do not assume that an arbitrary JavaScript timer will reliably execute indefinitely in the background.

If the emergency detection architecture requires native/background execution, use the appropriate native Android mechanism compatible with the selected React Native architecture.

Verify this on real devices.

83. REAL DEVICE TESTING

Do not consider the app complete after emulator-only testing.

Test on real Android devices with:

Wi-Fi
Mobile data
No internet
Battery saver
Screen locked
App backgrounded
App terminated
Permissions denied
Different Android versions
Different screen sizes

84. EDGE CASES

Explicitly test:

Duplicate tap
Double save
Back during save
App killed during sync
Network changes during sync
Token expires during request
Guardian unlinks Elder
Elder unlinks Guardian
Emergency occurs while another screen is open
Notification arrives while app is closed
Local DB migration
App update
Device reboot
Time/date changes
Timezone changes
Daylight-saving behavior where applicable

85. TIME AND DATE

Medication reminders and task scheduling must use reliable date/time handling.

Avoid manually manipulating date strings.

Store timestamps consistently and convert to local time for display.

Test:

timezone
device clock changes
midnight
next-day schedules
repeating schedules

86. DATA OWNERSHIP

Define clearly:

Elder owns Elder data
Guardian receives only authorized data
Backend enforces relationship
Local cache follows authenticated user
Logout clears or isolates sensitive session state

Never allow data from one authenticated account to appear after another account logs in on the same device.

87. MULTI-USER DEVICE SAFETY

Because Elder and Guardian are separate roles:

After logout:

clear role-specific navigation state

clear sensitive cached state as appropriate

clear user-specific in-memory stores

remove stale notification subscriptions where required

prevent back-navigation into protected screens

Test:

Elder logout
→ Guardian login

and:

Guardian logout
→ Elder login

with no cross-role data leakage.

88. PRODUCT CONSISTENCY

Before adding a new screen, ask:

Which navigation level is it?

Which app shell does it belong to?

Which reusable components already exist?

What are its loading/empty/error/offline states?

How does it behave with large text?

How is it localized?

What happens when the user presses Back?

Does it require authentication?

What data does it access?

Can the user access it offline?

What happens if synchronization fails?

If these are unknown, do not simply build the happy-path UI.

89. DO NOT RANDOMLY REDESIGN

If an existing screen is already correct and consistent:

preserve it

refactor it into reusable components if necessary

improve accessibility

connect it to real data

fix functional issues

Do not redesign the entire application just because a newer visual style seems attractive.

90. DO NOT CREATE PLACEHOLDER FUNCTIONALITY

Do not implement fake:

API success
Database success
Notification success
Sync success
Emergency success
Authentication success

A button must either:

perform the actual feature, or

clearly be marked as incomplete in development

Do not simulate production behavior with fake delays.

91. DO NOT INVENT CONTACT INFORMATION

Support phone numbers, email addresses, organization details, and emergency-service information must come from approved project data.

Never invent production contact details.

92. DO NOT INVENT MEDICAL INFORMATION

The application is a support tool.

Do not generate:

medication dosage advice

diagnosis

treatment recommendations

emergency medical protocols

unless explicitly supplied as approved project content.

93. SCREEN COMPLETENESS

A screen is not considered complete just because the UI exists.

A screen is complete only when:

UI
+
Navigation
+
Data
+
Validation
+
Loading
+
Empty
+
Error
+
Offline
+
Sync
+
Accessibility
+
Localization
+
Security
+
Tests

are handled appropriately.

94. DEFINITION OF DONE

A feature is complete when:

Frontend

[ ] UI implemented
[ ] Design system components used
[ ] Navigation implemented
[ ] Real API/local DB integration
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Offline state
[ ] Sync state
[ ] Accessibility
[ ] Localization
[ ] Validation

Backend

[ ] Route
[ ] Controller
[ ] Service
[ ] Repository
[ ] Validation
[ ] Authorization
[ ] Error handling
[ ] Logging
[ ] Tests

Database

[ ] Migration
[ ] Constraints
[ ] Indexes
[ ] Seed/test data
[ ] Sync metadata

QA

[ ] Unit tests
[ ] Integration tests
[ ] E2E/UI tests
[ ] Offline tests
[ ] Security tests
[ ] Accessibility tests

95. IMPLEMENTATION ORDER

Do not build features in random order.

Follow this order.

Phase 0 — Repository Audit

Before changing anything:

1. Inspect repository structure.
2. Inspect package.json files.
3. Inspect TypeScript configuration.
4. Inspect navigation.
5. Inspect existing screens.
6. Inspect existing API.
7. Inspect database schema/migrations.
8. Inspect SQLite implementation.
9. Inspect sync implementation.
10. Inspect authentication.
11. Inspect FCM.
12. Inspect TensorFlow Lite integration.
13. Inspect environment configuration.
14. Inspect tests.
15. Identify broken/incomplete modules.

Create:

docs/CODEBASE_AUDIT.md

96. Phase 1 — Architecture Stabilization

Implement/fix:

Authentication architecture
Role separation
Navigation architecture
Design system
Global state
API client
Error system
Localization
Accessibility foundation
Database repositories

Do this before polishing dozens of individual screens.

97. Phase 2 — Database

Verify:

PostgreSQL schema
SQLite schema
migrations
relationships
indexes
constraints
sync metadata

Then test repositories.

98. Phase 3 — Backend

Implement/fix:

Auth
Users
Elder
Guardian
Pairing
Medication
Tasks if approved
Journal if approved
Emergency
Risk
Notifications
Sync

Every endpoint must be tested.

99. Phase 4 — Offline Sync

Implement:

Local write
Queue
Connectivity detection
Upload
Download
Conflict resolution
Retry
Idempotency
Sync status

Test offline → online transitions extensively.

100. Phase 5 — Elder Mode

Implement screens in this order:

Authentication
↓
Elder Home
↓
Medication
↓
Safety
↓
Emergency
↓
Guardian connection
↓
Profile
↓
Settings
↓
Accessibility
↓
Privacy
↓
Help & Support

Do not add inconsistent navigation between them.

101. Phase 6 — Guardian Mode

Implement:

Guardian Login
↓
Guardian Dashboard
↓
Notifications
↓
Risk Overview
↓
Elder Safety
↓
Medication Monitoring
↓
Emergency Events
↓
Guardian settings

Guardian must always operate in a separate authenticated session.

102. Phase 7 — Emergency

Complete:

TensorFlow Lite
Audio pipeline
Keyword detection
Emergency event creation
Countdown
Confirmation
Cancellation
Local persistence
Sync
FCM notification
Guardian event

Then test it on a real Android device.

103. Phase 8 — Quality

Run:

Lint
Typecheck
Unit tests
Integration tests
E2E tests
Accessibility tests
Offline tests
Security tests
Performance tests

Fix issues instead of suppressing them.

104. Phase 9 — Production Readiness

Verify:

Environment configuration
Database migrations
Production API configuration
FCM
Android permissions
Release signing
AAB build
Crash/error monitoring
Backup strategy
Rollback strategy
Documentation

105. CLAUDE WORKFLOW

When you start working on the repository, follow this exact sequence.

Step 1

Inspect the entire repository.

Do not immediately modify files.

Step 2

Create:

docs/CODEBASE_AUDIT.md

with:

Existing architecture
Existing features
Missing features
Broken features
Technical debt
Navigation inconsistencies
Database problems
Backend problems
Security problems
Testing gaps

Step 3

Create:

docs/IMPLEMENTATION_PLAN.md

with a prioritized checklist.

Step 4

Fix foundational architecture.

Step 5

Implement feature-by-feature.

Step 6

After every major feature:

typecheck
lint
unit tests
integration tests where relevant

Step 7

Do not leave the repository in a broken state.

106. CLAUDE MUST KEEP A TODO TRACKER

Maintain:

docs/IMPLEMENTATION_STATUS.md

Example:

# Implementation Status

## Authentication
- [x] Role selection
- [x] Elder login
- [ ] Guardian login
- [ ] Token refresh
- [ ] Logout cleanup

## Elder Mode
- [x] Home
- [ ] Medication
- [ ] Emergency
...

## Backend
...

## Database
...

## Testing
...

Update this file as work progresses.

107. NO FAKE COMPLETION

Never mark:

[x]

unless the feature has been implemented and tested.

Use:

[ ]

for incomplete items.

108. CODE REVIEW CHECKLIST

Before declaring the application complete:

Architecture

[ ] Clear module boundaries
[ ] No circular dependencies
[ ] No duplicate business logic
[ ] No giant components

Frontend

[ ] Consistent design
[ ] Consistent navigation
[ ] Accessible
[ ] Localized
[ ] Offline-aware

Backend

[ ] Secure
[ ] Validated
[ ] Authorized
[ ] Tested
[ ] Documented

Database

[ ] Migrated
[ ] Indexed
[ ] Constrained
[ ] Tested

Sync

[ ] Retry-safe
[ ] Idempotent
[ ] Conflict-aware
[ ] Observable

Emergency

[ ] Offline
[ ] Low latency
[ ] Persistent
[ ] Retry-safe
[ ] Guardian notification

109. FINAL ACCEPTANCE CRITERIA

The application should be considered industry-standard only when all of the following are true:

PRODUCT
[ ] Elder-focused UX
[ ] Guardian role
[ ] Trilingual
[ ] Offline-first

FRONTEND
[ ] Consistent design system
[ ] Consistent navigation
[ ] Complete screens
[ ] Real data integration
[ ] Accessibility
[ ] Localization
[ ] Error/empty/loading states

BACKEND
[ ] REST API
[ ] Authentication
[ ] Authorization
[ ] Validation
[ ] Business logic
[ ] Notifications
[ ] Sync
[ ] Error handling

DATABASE
[ ] SQLite
[ ] PostgreSQL
[ ] Migrations
[ ] Constraints
[ ] Indexes
[ ] Sync metadata

EMERGENCY
[ ] TensorFlow Lite
[ ] On-device detection
[ ] Countdown
[ ] Confirmation
[ ] Cancellation
[ ] Offline persistence
[ ] Guardian notification
[ ] Retry-safe delivery

GUARDIAN
[ ] Separate authentication
[ ] Separate navigation
[ ] Elder pairing
[ ] Risk overview
[ ] Notifications
[ ] Emergency events
[ ] Medication monitoring
[ ] Authorization

SECURITY
[ ] bcrypt
[ ] JWT
[ ] Secure token storage
[ ] Role authorization
[ ] Ownership checks
[ ] HTTPS
[ ] Secrets protected
[ ] Audit logging

SYNC
[ ] Queue
[ ] Retry
[ ] Conflict resolution
[ ] Idempotency
[ ] Priority
[ ] Status
[ ] Offline tests

QUALITY
[ ] Unit tests
[ ] Integration tests
[ ] E2E tests
[ ] Security tests
[ ] Accessibility tests
[ ] Performance tests
[ ] Real-device testing

DEPLOYMENT
[ ] Development
[ ] Staging
[ ] Production
[ ] CI/CD
[ ] Android release signing
[ ] AAB
[ ] Monitoring
[ ] Backup
[ ] Rollback

110. FINAL INSTRUCTION TO CLAUDE SONNET 4.6

Do not simply make the application look complete. Make the underlying system complete.

You are responsible for identifying gaps across:

Frontend
Backend
Database
Offline storage
Synchronization
Authentication
Authorization
AI
Notifications
Security
Accessibility
Localization
Testing
Deployment
Documentation

If an existing implementation is weak, refactor it.

If a feature is missing, implement it.

If a feature exists but is disconnected from the backend, connect it.

If a screen exists but has no real data, connect it.

If data exists but is not offline-safe, fix it.

If offline sync exists but is unsafe, redesign the sync flow.

If navigation is inconsistent, standardize it.

If UI components are duplicated, consolidate them.

If backend authorization is missing, implement it.

If database constraints are missing, add them through migrations.

If tests are missing, write them.

If requirements conflict, do not guess silently; document the decision.

Do not delete working functionality simply to simplify the codebase.

Do not replace the entire project with a new stack unless the repository and approved requirements clearly require it.

Do not use fake data as a substitute for real integration.

Do not expose technical implementation details to Elder users.

Do not expose sensitive healthcare information to unauthorized Guardians.

Do not allow Elder sessions to access Guardian resources.

Do not treat the internet as a dependency for core Elder functionality.

Do not consider a screen complete until its appropriate states, accessibility, localization, data integration, security, and tests are addressed.

The final result should be a cohesive, maintainable, secure, offline-first Android application suitable for a serious university capstone demonstration and structured so that it can be maintained and extended after the project.

111. REQUIRED DELIVERABLES

At the end of implementation, the repository should contain, where applicable:

README.md
docs/
├── CODEBASE_AUDIT.md
├── IMPLEMENTATION_PLAN.md
├── IMPLEMENTATION_STATUS.md
├── ARCHITECTURE.md
├── API.md
├── DATABASE.md
├── SYNC.md
├── SECURITY.md
├── TESTING.md
└── DECISIONS.md

The codebase should contain:

Mobile application
Backend application
Database migrations
SQLite migrations
Tests
Environment examples
CI configuration
Build configuration

112. IMPORTANT SOURCE-BASED NOTES

The project documentation describes React Native, Node.js/Express.js, PostgreSQL, SQLite, TensorFlow Lite, JWT/bcrypt, and FCM as the core technology stack.

The documentation also describes Daily Tasks and Mood/Journal modules in some versions. If the repository contains those features, preserve and integrate them unless the latest approved project scope explicitly removes them.

Do not silently combine conflicting versions of the project requirements.

The central architectural requirement that should remain stable is:

Offline-first mobile application
+
Local SQLite
+
Backend REST API
+
PostgreSQL
+
On-device emergency keyword detection
+
Guardian notification
+
Role-based Elder/Guardian access

113. SUCCESS CONDITION

The project is successful when a reviewer can:

1. Install the Android application.
2. Select Elder or Guardian role.
3. Authenticate as the correct role.
4. Navigate through a consistent UI.
5. Use core Elder functionality without internet.
6. Create/update local data offline.
7. Restore connectivity and synchronize safely.
8. Trigger/test the emergency workflow.
9. Confirm/cancel an emergency.
10. Deliver the appropriate Guardian notification.
11. Log in separately as Guardian.
12. View only authorized Elder information.
13. Review relevant risk/alert information.
14. Verify medication-related monitoring.
15. Test error and offline states.
16. Test accessibility.
17. Run automated tests.
18. Build a release Android artifact.

No part of this flow should depend on hidden manual database edits, fake API responses, or undocumented setup steps.

114. START HERE

Claude Sonnet 4.6: Do not implement screens immediately.

Start with:

1. Repository audit
2. Requirements reconciliation
3. Architecture audit
4. Navigation audit
5. Design-system audit
6. Database audit
7. Backend/API audit
8. Sync audit
9. Security audit
10. Testing audit

Then produce:

docs/CODEBASE_AUDIT.md
docs/IMPLEMENTATION_PLAN.md
docs/IMPLEMENTATION_STATUS.md

Only after those are created should implementation begin.

The objective is a complete, coherent system—not merely a collection of finished-looking screens.