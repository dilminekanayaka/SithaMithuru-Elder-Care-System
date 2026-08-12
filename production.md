SithaMithuru — Full Application Audit, Real Data Integration & Deployment-Ready Master Prompt

ROLE

Act as a Senior Full-Stack Mobile Application Architect, Senior React Native Engineer, Senior UI/UX Designer, Senior Backend Engineer, PostgreSQL Database Engineer, Offline-First Architect, QA Engineer, Security Engineer, DevOps Engineer, and Production Readiness Engineer.

You are working on the existing SithaMithuru application.

Your responsibility is to take the ENTIRE EXISTING APPLICATION and transform it from its current incomplete/prototype state into a fully functional, visually consistent, real-data-connected, tested, secure, and deployment-ready application.

This is not a request to create a few new screens.

This is not a request to only improve the UI.

This is not a request to only connect the API.

This is a FULL APPLICATION AUDIT + REPAIR + INTEGRATION + UI CONSISTENCY + REAL DATA + DATABASE + BACKEND + TESTING + DEPLOYMENT READINESS project.

1. THE CURRENT PROBLEM

The existing application has multiple problems such as:

some screens are missing

some screens are incomplete

different screens use different UI styles

navigation is inconsistent

components are duplicated

spacing is inconsistent

typography is inconsistent

colors are inconsistent

cards/buttons/inputs look different between screens

some screens contain dummy data

some screens contain hard-coded data

some screens contain mock statistics

some screens contain fake users

some screens contain placeholder notifications

some screens are not connected to the database

some screens are not connected to the backend

some API connections are missing

some API connections may use incorrect URLs

some backend endpoints may be missing

some backend endpoints may not match frontend expectations

database schemas may not match frontend/backend models

some features may work only because of mock data

some buttons may not perform real operations

some navigation flows may be incomplete

some screens may not handle loading/error/empty/offline states

some data may not persist after app restart

offline functionality may be incomplete

synchronization may be incomplete

authentication may be incomplete

authorization may be incomplete

Guardian Mode may be incomplete

Elder Mode may be incomplete

notifications may not be fully connected

emergency functionality may not be fully connected

production configuration may not be ready

testing may be incomplete

Assume that there are hidden problems even if the application currently builds successfully.

Do not judge the application based only on whether it compiles.

2. THE FINAL GOAL

The final application must reach this state:

A real Elder and a real Guardian should be able to install the application, register/login, navigate through the complete application, use the actual features, create and update real data, receive real data from the backend, continue using approved core features offline, synchronize data when the connection returns, receive relevant notifications, and use the application without encountering obvious prototype behavior.

The application must feel like:

ONE PRODUCT
ONE DESIGN SYSTEM
ONE ARCHITECTURE
ONE DATA SYSTEM
ONE USER EXPERIENCE

It must NOT feel like:

A collection of independently designed screens
A Figma prototype
A student UI demo
A mock application
A collection of fake dashboards

3. CRITICAL RULE — AUDIT THE ENTIRE APPLICATION FIRST

Before making major changes:

AUDIT THE ENTIRE REPOSITORY.

Do not immediately start editing one screen.

Do not assume that the current navigation represents all required screens.

Do not assume that the backend works because files exist.

Do not assume that the database is connected because PostgreSQL is installed.

Do not assume that API calls work because functions exist.

Do not assume that data is real because it is displayed in a card.

Inspect everything.

4. COMPLETE REPOSITORY AUDIT

Inspect all relevant parts of the repository:

Mobile frontend
React Native
TypeScript
Navigation
Screens
Components
Hooks
State management
API clients
Repositories
SQLite
Offline storage
Sync
Authentication
Authorization
Backend
Routes
Controllers
Services
Repositories
Middleware
Validation
PostgreSQL
Migrations
Seed data
Firebase
FCM
Emergency/ML integration
Localization
Assets
Environment variables
Tests
Android configuration
Build configuration
CI/CD
Documentation

For every major module determine:

EXISTS?
WORKS?
PARTIALLY WORKS?
MOCK?
HARDCODED?
CONNECTED?
BROKEN?
INCOMPLETE?
INCONSISTENT?
SECURE?
TESTED?
PRODUCTION READY?

5. DO NOT MAKE ASSUMPTIONS

If you find:

TODO
FIXME
placeholder
mock
dummy
sample
fake
hardcoded
temporary
test data
static data

inspect it.

Do not automatically delete it.

Determine what real functionality it represents.

Then replace it with the correct production implementation.

6. CREATE A FULL APPLICATION AUDIT

Create:

docs/FULL_APPLICATION_AUDIT.md

Include:

# Full Application Audit

## 1. Executive Summary

## 2. Current Architecture

## 3. Frontend Audit

## 4. Complete Screen Inventory

## 5. Missing Screens

## 6. Incomplete Screens

## 7. UI Consistency Audit

## 8. Design System Audit

## 9. Mock/Dummy Data Audit

## 10. Real Data Audit

## 11. API Audit

## 12. Backend Audit

## 13. PostgreSQL Audit

## 14. SQLite Audit

## 15. Authentication Audit

## 16. Authorization Audit

## 17. Navigation Audit

## 18. Offline-First Audit

## 19. Synchronization Audit

## 20. Emergency System Audit

## 21. Guardian System Audit

## 22. Notification Audit

## 23. Localization Audit

## 24. Accessibility Audit

## 25. Security Audit

## 26. Performance Audit

## 27. Testing Audit

## 28. Android Build Audit

## 29. Deployment Audit

## 30. Critical Problems

## 31. High Priority Problems

## 32. Medium Priority Problems

## 33. Low Priority Problems

## 34. Recommended Repair Order

7. COMPLETE SCREEN DISCOVERY

Do NOT simply inspect existing navigation and conclude that those are all the screens.

Determine the complete required screen set from:

existing code
existing navigation
approved project requirements
existing SRS/project documentation
existing backend capabilities
existing database domain
existing feature flows

Create a complete inventory.

Use:

ID

Screen

Role

Exists

UI

Navigation

API

Backend

DB

Offline

Status























Include:

authentication screens

Elder screens

Guardian screens

medication screens

emergency screens

safety screens

profile screens

settings screens

notification screens

pairing screens

history screens

empty states

error states

confirmation flows

supporting screens

modal/bottom-sheet flows where applicable

Do not invent features that are outside the approved scope.

8. SCREEN-BY-SCREEN AUDIT

For EVERY screen inspect:

Purpose
User role
Entry point
Exit point
Navigation
UI
Components
Data source
API
Backend
Database
Local database
State management
Validation
Authentication
Authorization
Loading
Empty state
Error state
Offline state
Sync state
Accessibility
Localization
Security

Create a screen status:

MISSING
INCOMPLETE
UI ONLY
MOCK DATA
PARTIALLY CONNECTED
FUNCTIONAL
PRODUCTION READY

9. FIRST MAJOR OBJECTIVE — MAKE EVERY SCREEN MODERN AND CONSISTENT

The current screens may have been designed separately.

This must be completely corrected.

Do NOT redesign each screen independently.

First establish a single SithaMithuru Design System.

Then refactor every screen to use that system.

10. CREATE A SINGLE DESIGN SYSTEM

Centralize:

Colors
Typography
Spacing
Border Radius
Elevation
Icons
Buttons
Inputs
Cards
Lists
Headers
Navigation
Dialogs
Bottom Sheets
Tabs
Badges
Status indicators
Alerts
Loading states
Empty states
Error states
Offline states

Every screen must consume these shared tokens/components.

11. VISUAL CONSISTENCY RULE

When a user moves through:

Login
→ Home
→ Medication
→ Safety
→ Emergency
→ Profile
→ Settings

the user must immediately feel:

"This is the same application."

Not:

Screen A = one design
Screen B = another design
Screen C = another design

12. STANDARDIZE ALL VISUAL VALUES

Do not allow random values throughout the application.

Standardize:

screen horizontal padding
vertical spacing
section spacing
card padding
button height
input height
icon sizes
title sizes
body sizes
caption sizes
border radius
shadows

Use design tokens.

Example:

spacing.xs
spacing.sm
spacing.md
spacing.lg
spacing.xl

radius.sm
radius.md
radius.lg

typography.title
typography.heading
typography.body
typography.caption

13. STANDARDIZE COMPONENTS

Create/reuse:

AppHeader
BackHeader
BottomNavigation
PrimaryButton
SecondaryButton
DangerButton
AppInput
SearchInput
AppCard
MedicationCard
AlertCard
RiskCard
StatusCard
ListItem
SectionHeader
EmptyState
LoadingState
ErrorState
OfflineBanner
SyncIndicator
ConfirmationDialog
BottomSheet

If multiple screens have duplicate versions of the same component:

refactor them into one shared component.

14. ELDER MODE CONSISTENCY

Elder Mode must use one consistent navigation shell.

Top-level navigation should follow the approved application architecture.

Do not randomly change:

bottom navigation
top navigation
header
back button
tab structure

between screens.

Secondary screens should follow one consistent:

← Screen Title

pattern where applicable.

15. GUARDIAN MODE CONSISTENCY

Guardian Mode must have its own role-specific navigation.

Do not send an Elder directly into Guardian Dashboard.

The correct structure is:

Authentication
     │
     ├── Elder
     │     ↓
     │  Elder Mode
     │
     └── Guardian
           ↓
       Guardian Mode

Both modes should share the same global design system.

16. REMOVE SCREEN-SPECIFIC DESIGN SYSTEMS

Find and eliminate situations such as:

Screen A uses font size 18
Screen B uses 20
Screen C uses 22
Screen D uses 16

or:

Screen A radius 12
Screen B radius 20
Screen C radius 8

unless intentionally defined by the design system.

17. DO NOT ONLY MAKE THE UI LOOK BETTER

This is extremely important.

Do NOT spend the majority of the work polishing screens that still use fake data.

The order is:

Audit
↓
Architecture
↓
Database
↓
Backend
↓
API
↓
Real Data
↓
State Management
↓
Offline/Sync
↓
UI Standardization
↓
Accessibility
↓
Testing
↓
Deployment

18. REMOVE ALL MOCK/DUMMY DATA

Search the entire codebase for:

dummy
mock
fake
sample
placeholder
hardcoded
static
temporary
demo
testUser
sampleUser
fakeUser
mockData

Also manually inspect:

dashboard arrays
notification arrays
medication arrays
Guardian arrays
Elder arrays
risk values
statistics
chart values
history values
profile values

19. CLASSIFY EVERY DATA SOURCE

For every displayed value determine:

REAL DATABASE DATA
REAL LOCAL SQLITE DATA
REAL API DATA
DERIVED DATA
MOCK DATA
HARDCODED DATA

No important production screen should rely on mock/hardcoded data.

20. WHEN REAL DATA DOES NOT EXIST

This is important.

If a screen requires data but the current database has no suitable records:

Do NOT keep the screen fake.

Instead:

Determine the correct database entity.

Create the required database schema/migration if needed.

Create the backend model/repository/service.

Create the API endpoint.

Connect the mobile repository/API client.

Connect the screen.

Create legitimate development seed data where appropriate.

Verify that the UI reads that data from the real data layer.

Development seed data is acceptable.

Fake hard-coded UI data is NOT.

21. DEVELOPMENT SEED DATA

If a clean database has no data, create realistic development seed data.

Example:

Development Elder
Development Guardian
Medication records
Medication logs
Safety records
Emergency records
Notifications
Risk assessments

The important distinction is:

BAD:
UI → hardcoded fake array

GOOD:
Seed script → PostgreSQL
                 ↓
              API
                 ↓
              Mobile

For offline-first features:

PostgreSQL
↓
API
↓
SQLite
↓
Mobile UI

22. REAL DATA ARCHITECTURE

Every important feature should follow:

UI
 ↓
Feature Hook / State
 ↓
Repository / Service
 ↓
API Client
 ↓
Backend API
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL

For offline-first:

UI
 ↓
Local Repository
 ↓
SQLite
 ↓
Sync Queue
 ↓
Backend API
 ↓
PostgreSQL

Do not directly access the database from UI components.

23. DATABASE AUDIT

Inspect the actual PostgreSQL database schema.

Verify:

tables
columns
types
primary keys
foreign keys
constraints
indexes
unique constraints
nullable fields
relationships
migrations
seed scripts

Compare it with:

Frontend models
Backend models
API contracts
SQLite schema

Fix all mismatches.

24. DATABASE INTEGRITY

Use:

primary keys
foreign keys
unique constraints
check constraints
transactions
indexes
timestamps
migrations

Do not rely on frontend validation to protect database integrity.

25. SQLITE AUDIT

Verify that SQLite is actually being used where offline-first behavior requires it.

Test:

insert
select
update
delete
transaction
migration
app restart
offline operation

The user must not lose locally stored data after closing/reopening the application.

26. BACKEND AUDIT

Inspect:

Routes
Controllers
Services
Repositories
Middleware
Validation
Authentication
Authorization
Database access
Error handling
Logging

Every important frontend feature must have the corresponding backend functionality where server persistence is required.

27. API AUDIT

Inspect every frontend API call.

For each one verify:

Correct base URL
Correct endpoint
Correct HTTP method
Correct request body
Correct headers
Correct authentication
Correct response type
Correct error handling
Correct backend route
Correct database operation

Find and fix:

localhost URLs
broken URLs
wrong endpoints
missing endpoints
wrong HTTP methods
wrong payloads
wrong field names
missing tokens
incorrect response parsing

28. API CONTRACT

Frontend and backend must share a consistent contract.

Verify:

IDs
field names
types
dates
timestamps
nullable fields
pagination
error responses
success responses

Do not create frontend hacks to compensate for incorrect backend responses.

Fix the actual contract.

29. AUTHENTICATION

Verify real:

Register
Login
Token generation
Token validation
Session restoration
Token expiry
Logout
Session cleanup

No fake authentication.

30. AUTHORIZATION

Verify:

Elder permissions
Guardian permissions
Resource ownership
Guardian/Elder relationship

A Guardian must not be able to access another Elder's data.

An Elder must not be able to access Guardian-only resources.

Authorization must be enforced by the backend.

31. USER DATA ISOLATION

Test:

Elder A
Guardian A
Elder B
Guardian B

Verify:

Guardian A → Elder A only
Guardian B → Elder B only

Also verify:

Logout
→ Login with another account
→ No previous account data visible

32. OFFLINE-FIRST

Core approved Elder functionality must remain usable without internet.

When offline:

Local data remains accessible
Local writes are persisted
Sync queue records pending operations
UI communicates offline state

When online:

Pending changes synchronize
Remote changes are downloaded
Conflicts are resolved
Sync status updates

33. SYNCHRONIZATION

Implement/repair the sync engine.

It must support:

Queue
Retry
Priority
Idempotency
Conflict handling
Status
Failure recovery

Do not create duplicate records during retry.

Emergency events must receive highest priority.

34. EMERGENCY FLOW

Audit the entire emergency system, not just the emergency screen.

Verify:

On-device detection
↓
Detection event
↓
Emergency UI
↓
Countdown
↓
Cancel / Confirm
↓
Local persistence
↓
Sync
↓
Backend
↓
Guardian notification

Every step must be functional.

35. GUARDIAN DASHBOARD

Remove all fake dashboard values.

Every:

risk status
medication count
alert count
emergency count
recent activity
last sync
Elder information

must come from actual data or a clearly defined derived calculation.

36. MEDICATION DATA

Verify complete flow:

Create medication
↓
Database
↓
API
↓
SQLite
↓
Medication screen
↓
Reminder
↓
Medication action
↓
Medication log
↓
Sync
↓
Guardian monitoring where approved

37. NOTIFICATIONS

Verify real notification flow.

Do not rely on fake UI notifications.

Test:

FCM token registration
Token refresh
Notification creation
Backend delivery
Foreground
Background
Terminated app
Logout
Re-login
Emergency notification
Relevant Guardian notifications

38. LOADING / EMPTY / ERROR / OFFLINE STATES

Every data-driven screen must properly handle:

Loading
Success
Empty
Error
Offline
Syncing
Synced
Stale data
Retry

Do not display:

blank white screen
fake data while loading
technical exception messages

39. ACCESSIBILITY

Because this is an Elder-focused application, accessibility is a production requirement.

Verify:

large text
dynamic font scaling
large touch targets
high contrast
TalkBack
semantic labels
focus order
clear language

Critical information must not depend only on color.

40. LOCALIZATION

Ensure all user-visible strings come from the localization system.

Support the approved:

English
Sinhala
Tamil

Do not hard-code UI text inside components.

41. SECURITY

Audit:

password hashing
JWT
secure token storage
role authorization
ownership validation
input validation
SQL injection protection
CORS
rate limiting
HTTPS
environment secrets
logging

Never expose:

passwords
JWTs
database credentials
Firebase private credentials

42. PRODUCTION CONFIGURATION

Verify:

development environment
staging environment
production environment

The application must not accidentally use:

localhost
development database
test Firebase project
debug secrets

in production configuration.

43. REMOVE DEBUG/PROTOTYPE BEHAVIOR

Search for:

console.log
console.error
alert("test")
navigation to temporary screen
fake delay
setTimeout pretending to be API
mock response
hardcoded user
hardcoded token
hardcoded ID

Replace prototype behavior with proper production behavior.

44. TESTING

Create tests for:

Authentication
Authorization
Database
API
Medication
Emergency
Guardian
Notifications
Offline
Sync
UI
Navigation

At minimum implement:

Unit tests
Integration tests
E2E tests

45. REAL USER TESTING

Perform complete real-user scenarios.

Elder

Install
Register/Login
Home
Medication
Reminder
Medication action
Safety
Emergency
Cancel emergency
Confirm emergency
Offline
Reconnect
Sync
Logout

Guardian

Install
Register/Login
Pair with Elder
Dashboard
View real data
Medication monitoring
Risk information
Receive notification
Emergency event
Logout

46. FAILURE TESTING

Test:

No internet
Slow internet
Backend down
Database unavailable
FCM unavailable
Expired token
Invalid token
Invalid input
Duplicate action
App restart
App killed during sync
Network lost during save
Network restored during sync
Permission denied

The application must recover gracefully.

47. REAL DEVICE TESTING

Do not rely only on emulator testing.

Test the application on real Android devices.

Verify:

Wi-Fi
Mobile data
No internet
Screen lock
Background
Terminated app
Battery saver
Permissions
Notifications
Microphone
Different screen sizes

48. BUILD AND DEPLOYMENT

The final application must be buildable.

Verify:

Debug APK
Release APK
AAB

Verify:

environment configuration
Android permissions
Firebase configuration
release signing
API URL
production database
production backend

49. DEPLOYMENT READINESS

Before declaring the app ready, verify:

Backend can start in production
Database migrations work
Database connection works
API works
Mobile connects to production API
Authentication works
Authorization works
FCM works
Emergency flow works
Offline flow works
Sync works
Release build works

50. FINAL APPLICATION AUDIT

After all repairs, run the audit AGAIN.

Do not assume that fixing code means the application is ready.

Repeat:

Screen audit
UI audit
Dummy-data audit
API audit
Backend audit
Database audit
Offline audit
Sync audit
Security audit
Testing audit
Deployment audit

51. FINAL ACCEPTANCE CRITERIA

The application is ready only when:

[ ] All required screens exist
[ ] All required navigation flows work
[ ] UI is visually consistent
[ ] One design system is used throughout
[ ] Important dummy data is removed
[ ] Real data flows through the application
[ ] Development seed data is stored in the database, not hardcoded in UI
[ ] PostgreSQL is connected
[ ] SQLite is connected
[ ] Backend is connected
[ ] APIs are connected
[ ] Authentication works
[ ] Authorization works
[ ] Elder/Guardian separation works
[ ] Offline-first behavior works
[ ] Synchronization works
[ ] Emergency flow works
[ ] Guardian notifications work
[ ] Loading states work
[ ] Empty states work
[ ] Error states work
[ ] Offline states work
[ ] Accessibility works
[ ] Localization works
[ ] Security issues are addressed
[ ] Automated tests pass
[ ] Real-device testing is complete
[ ] Release build succeeds
[ ] Production configuration is verified

52. IMPORTANT — DO NOT STOP AFTER AUDIT

The audit is NOT the final deliverable.

After identifying problems:

FIX THEM.

The workflow is:

AUDIT
↓
IDENTIFY
↓
PRIORITIZE
↓
IMPLEMENT
↓
CONNECT
↓
TEST
↓
RE-AUDIT
↓
FIX
↓
TEST AGAIN
↓
DEPLOYMENT CHECK

Do not simply give me a report listing 200 problems and stop.

53. IMPORTANT — DO NOT ASK ME TO FIX THINGS MANUALLY

If you discover:

missing API
missing database table
missing endpoint
missing screen
broken connection
incorrect navigation
duplicate component
dummy data
broken sync

implement the required solution yourself whenever the repository and requirements provide enough information.

Only ask for clarification when the missing information genuinely cannot be determined from:

existing code
approved requirements
database
API contracts
project documentation

54. IMPORTANT — PRESERVE APPROVED PROJECT SCOPE

Do not invent unrelated features.

Do not add:

live surveillance
remote camera
unapproved location tracking
unapproved medical diagnosis
unapproved medical recommendations
unapproved features

Focus on making the existing approved application fully functional and production-quality.

55. IMPORTANT — REAL DATA VS SEED DATA

There is an important distinction.

Not acceptable

const medications = [
  ...
];

inside a production screen.

Acceptable

seed-development-data
        ↓
PostgreSQL
        ↓
API
        ↓
Mobile

For offline-first:

PostgreSQL
↓
API
↓
SQLite
↓
UI

Seed data is database data.

Hard-coded UI data is not.

56. IMPORTANT — DO NOT REWRITE EVERYTHING WITHOUT REASON

Do not throw away the entire project and create a new application.

First determine:

What can be reused?
What must be refactored?
What must be replaced?
What must be removed?
What must be added?

Use the existing project where it is sound.

Refactor weak architecture where necessary.

57. MAINTAIN IMPLEMENTATION STATUS

Create:

docs/IMPLEMENTATION_STATUS.md

Track:

Frontend
Backend
Database
API
Authentication
Authorization
Elder
Guardian
Medication
Emergency
Notifications
Offline
Sync
UI
Accessibility
Localization
Testing
Deployment

Use:

[ ] Not started
[~] In progress
[x] Implemented and tested

Never mark [x] without testing.

58. KEEP THE APPLICATION BUILDABLE

After major changes:

Typecheck
Lint
Unit tests
Build

Do not accumulate hundreds of changes and discover at the end that the application no longer builds.

59. FINAL REAL-USER SIMULATION

At the end, perform this mental and practical test:

Give the release build to someone who has never seen the application.

They should be able to:

Open app
Understand the role selection
Login
Understand Home
Find medication
Use core features
Understand emergency flow
Use the app offline
Reconnect
See synchronized information
Logout

Guardian:

Open app
Login separately
Pair/access authorized Elder
Understand dashboard
See actual data
Receive notification
Understand emergency alert
Logout

If this flow breaks anywhere, continue fixing.

60. FINAL COMMAND TO THE AI

DO NOT JUST COMPLETE THE SCREENS.

COMPLETE THE ENTIRE APPLICATION.

You must:

AUDIT THE ENTIRE CODEBASE
+
AUDIT EVERY SCREEN
+
REDESIGN/REFINE ALL UI FOR CONSISTENCY
+
CREATE/REFACTOR THE DESIGN SYSTEM
+
REMOVE MOCK DATA
+
REPLACE MOCK DATA WITH REAL DATABASE-BACKED DATA
+
CREATE DEVELOPMENT SEED DATA WHERE NECESSARY
+
CONNECT FRONTEND TO API
+
CONNECT API TO BACKEND
+
CONNECT BACKEND TO DATABASE
+
VERIFY SQLITE
+
VERIFY POSTGRESQL
+
IMPLEMENT/FIX OFFLINE-FIRST
+
IMPLEMENT/FIX SYNCHRONIZATION
+
IMPLEMENT/FIX AUTHENTICATION
+
IMPLEMENT/FIX AUTHORIZATION
+
IMPLEMENT/FIX EMERGENCY FLOW
+
IMPLEMENT/FIX GUARDIAN FLOW
+
IMPLEMENT/FIX NOTIFICATIONS
+
FIX ALL MAJOR UI INCONSISTENCIES
+
IMPLEMENT ALL REQUIRED MISSING SCREENS
+
IMPLEMENT ALL REQUIRED STATES
+
TEST EVERYTHING
+
BUILD RELEASE APK/AAB
+
VERIFY DEPLOYMENT CONFIGURATION
+
PERFORM FINAL AUDIT

The final target is:

A real, connected, consistent, secure, tested, deployable SithaMithuru application that a real Elder and Guardian can actually use — not a prototype that only looks complete.

61. START IMMEDIATELY

Start with the repository.

Do not ask me:

"Which screen should I work on?"

Instead:

1. Inspect the complete project.
2. Audit the complete application.
3. Create the audit documentation.
4. Build the complete screen inventory.
5. Find every mock/dummy/hardcoded data source.
6. Find every broken/missing API connection.
7. Verify PostgreSQL.
8. Verify SQLite.
9. Verify backend.
10. Verify authentication/authorization.
11. Verify offline/sync.
12. Verify Guardian/Elder flows.
13. Establish one design system.
14. Repair the application systematically.
15. Replace fake data with real database-backed data.
16. Complete missing screens.
17. Test every important user flow.
18. Build the release version.
19. Perform a final full audit.
20. Only then consider the application real-user-ready.

Do not stop at the audit. Execute the repairs.