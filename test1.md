SITHAMITHURU — HARD VERIFICATION + ACTUAL IMPLEMENTATION PRODUCTION MANDATE

IMPORTANT: THIS IS AN EXECUTION MANDATE, NOT A REPORT-GENERATION TASK

You are working directly inside the existing SithaMithuru repository.

Your job is to inspect the actual codebase, identify the actual problems, modify the actual files, run the actual application/tests/builds, and leave the repository in a genuinely production-ready state.

Do NOT treat this task as a documentation exercise.

Do NOT produce a report saying something is complete unless you have actually verified it from the repository and runtime.

Do NOT claim:

"100% complete"

"production ready"

"all mock data removed"

"all APIs connected"

"database connected"

"all screens completed"

"tests passed"

"0 errors"

unless you have executed the relevant verification and have concrete evidence.

1. THE MOST IMPORTANT RULE

EVIDENCE > CLAIMS

For every completion claim, you must have evidence.

A statement such as:

"MedicinesScreen is connected to SQLite and PostgreSQL"

is NOT accepted merely because the source code contains an API call.

You must verify the complete chain:

UI
↓
State / Hook
↓
Repository / Service
↓
SQLite or API Client
↓
Backend Endpoint
↓
Backend Service
↓
PostgreSQL
↓
Response
↓
State
↓
UI

If one part is missing, the feature is NOT complete.

2. YOUR PREVIOUS TYPE OF RESPONSE IS NOT ACCEPTABLE

Do NOT respond with a summary such as:

Audit completed.
All requirements satisfied.
0 errors.
100% tests passed.
Production ready.

unless you actually:

inspected the relevant source files

inspected the database implementation

inspected the backend implementation

inspected the API implementation

inspected the frontend integration

executed the required commands

inspected command output

tested the relevant runtime behavior

fixed problems found

re-ran verification after fixing

A documentation file is NOT proof of implementation.

A test file existing is NOT proof that the test passed.

A function existing is NOT proof that the feature works.

A screen rendering is NOT proof that the screen is connected.

3. CORE OBJECTIVE

Transform the EXISTING application into:

A real, coherent, connected, reliable, secure, tested, deployment-ready mobile application that a real Elder and Guardian can actually use.

You must work on:

Frontend
UI/UX
Navigation
Components
State Management
API
Backend
PostgreSQL
SQLite
Offline Storage
Sync
Authentication
Authorization
Notifications
Emergency
Guardian
Elder
Localization
Accessibility
Testing
Android Build
Production Configuration
Deployment

4. DO NOT START BY WRITING DOCUMENTATION

The first phase is REPOSITORY DISCOVERY.

Do not immediately create:

FULL_APPLICATION_AUDIT.md

First inspect the repository.

5. PHASE 0 — REPOSITORY DISCOVERY

Inspect the actual filesystem.

Identify:

mobile/
frontend/
backend/
server/
api/
database/
src/
app/
components/
screens/
services/
repositories/
hooks/
stores/
models/
types/
utils/
tests/
android/

Use the actual directory structure of this project.

Do not invent paths.

Create a temporary understanding of:

Project structure
Frontend technology
Backend technology
Database technology
Mobile storage
Navigation system
State management
API architecture
Authentication
Notification system
Testing setup
Build system

6. PHASE 1 — COMPLETE SCREEN DISCOVERY

Do NOT rely only on the navigation configuration.

Find every screen by inspecting:

navigation files
screen directories
route definitions
imports
components
deep links
modals
bottom sheets
stack navigators
tab navigators
drawer navigators
role-specific navigation

Then compare this against:

SithaMithuru project requirements
existing documentation
approved features
existing backend capabilities
database entities

Create a real screen inventory.

For every screen record:

Screen
Role
File
Route
Exists?
Reachable?
UI Complete?
Real Data?
API Connected?
Backend Connected?
Database Connected?
Offline Support?
Loading State?
Empty State?
Error State?
Tested?

7. PHASE 2 — ACTUAL UI AUDIT

Open/inspect EVERY screen.

Do not infer UI consistency from component names.

Inspect actual implementation.

Look for:

different header designs
different bottom navigation
different typography
different colors
different spacing
different card styles
different button styles
different input styles
different icon sizes
different border radius
different shadows
different empty states
different loading states
different error states
different screen padding

The application must look like ONE product.

8. UI REPAIR REQUIREMENT

Do not merely report:

"UI inconsistency exists."

Actually fix it.

Create or refactor a shared design system:

colors
typography
spacing
radius
elevation
icons
buttons
inputs
cards
headers
navigation
dialogs
bottom sheets
lists
badges
status indicators
loading
empty
error
offline

Then migrate ALL relevant screens to the shared system.

Do not redesign only 2–3 screens.

The entire application must be consistent.

9. IMPORTANT UI REQUIREMENT

Do not create a completely new visual style unrelated to the existing SithaMithuru identity.

First inspect:

existing colors
existing assets
logo
icons
current branding
existing good screens

Then establish the strongest consistent visual language from the existing application.

Improve it to a modern professional level.

10. ELDER MODE

Audit every Elder screen.

Verify:

same navigation shell
same header logic
same spacing
same typography
same component system
same interaction patterns

Critical actions must be easy for elderly users.

Use:

large readable text
large touch targets
clear labels
high contrast
simple hierarchy
predictable navigation

11. GUARDIAN MODE

Guardian must be a separate authenticated role.

Verify:

Guardian Login
↓
Guardian Navigation
↓
Guardian Dashboard
↓
Guardian Features

Do NOT allow Elder users to enter Guardian-only screens through navigation hacks.

Backend authorization must also enforce this.

12. PHASE 3 — MOCK DATA HUNT

This is a CRITICAL phase.

Search the ENTIRE repository.

Search for patterns including:

dummy
mock
fake
sample
placeholder
hardcoded
static
demo
temporary
test data
example
TODO
FIXME
mockData
dummyData
sampleData
fakeData

Also manually inspect:

arrays
objects
statistics
dashboard values
notification lists
medication lists
task lists
journal lists
risk values
Guardian profiles
Elder profiles
emergency histories

13. MOCK DATA IS NOT REMOVED UNTIL REPLACED

Do NOT simply delete mock data.

For every mock data source determine:

What real entity does this represent?
Where should it be stored?
What database table should contain it?
What API should provide it?
What local SQLite table should contain it?
What state should expose it?

Then implement the real data flow.

14. WHEN THE DATABASE HAS NO DATA

If a screen needs data but the database is empty:

DO NOT keep hardcoded UI data.

Create legitimate DEVELOPMENT SEED DATA.

Correct architecture:

Seed Script
↓
PostgreSQL
↓
Backend API
↓
Mobile API Client
↓
Repository
↓
State
↓
UI

For offline-first:

PostgreSQL
↓
API
↓
SQLite
↓
UI

The UI itself must never contain fake production records.

15. DEVELOPMENT SEED DATA REQUIREMENT

If necessary, create:

database/seed
prisma seed
typeorm seed
sql seed
scripts/seed

using the project's actual technology.

Seed realistic interconnected records.

For example:

User
Elder Profile
Guardian
Guardian-Elder Relationship
Medication
Medication Schedule
Medication Log
Task
Task Completion
Journal Entry
Emergency Event
Notification
Risk Data

Only create entities that belong to the approved project scope.

16. PHASE 4 — DATABASE AUDIT

Inspect the actual PostgreSQL implementation.

Verify:

database connection
schema
tables
columns
primary keys
foreign keys
indexes
constraints
migrations
seed
transactions
relationships

Compare PostgreSQL with:

backend models
API DTOs
frontend types
SQLite schema

Fix mismatches.

17. DATABASE MUST BE ACTUALLY TESTED

Do not say:

"PostgreSQL integration complete"

because an ORM configuration exists.

Actually verify:

INSERT
SELECT
UPDATE
DELETE
RELATIONSHIP
TRANSACTION

using the real database.

Where practical, verify the records directly in PostgreSQL after operations.

18. PHASE 5 — SQLITE AUDIT

Verify the actual SQLite implementation.

Test:

Create
Read
Update
Delete
Persistence
Migration
Transaction
App restart
Offline operation

Example:

Create medication offline
↓
Kill app
↓
Restart app
↓
Medication still exists

If it does not, fix it.

19. PHASE 6 — API AUDIT

Find EVERY API call in the frontend.

For every call verify:

base URL
endpoint
HTTP method
headers
authentication
request payload
response type
error handling
backend route
controller
service
database operation

Create a real API map.

Example:

GET /api/v1/medications
Frontend:
  MedicinesScreen
  ↓
  medicationRepository
  ↓
  apiClient

Backend:
  route
  ↓
  controller
  ↓
  medicationService
  ↓
  medicationRepository
  ↓
  PostgreSQL

20. API CONNECTION MUST BE PROVEN

Do not accept:

apiService.ts exists

as proof.

Do not accept:

axios.get(...)

as proof.

You must verify the endpoint actually responds correctly.

Where the project allows it, run the backend and make real requests.

Verify:

2xx success
4xx validation/auth errors
5xx behavior
database persistence
response structure

21. NO LOCALHOST PRODUCTION CONNECTIONS

Search for:

localhost
127.0.0.1
10.0.2.2
192.168.

Determine whether each occurrence is:

development only
test only
production configuration

Production configuration must point to the real deployable backend.

22. PHASE 7 — BACKEND AUDIT

Inspect:

routes
controllers
services
repositories
middleware
validation
authentication
authorization
error handling
database
logging

For every required feature:

Route
↓
Controller
↓
Service
↓
Repository
↓
Database

must exist where appropriate.

23. PHASE 8 — AUTHENTICATION

Test the actual authentication flow:

Register
Login
Token
Session restoration
Token expiry
Refresh
Logout
Re-login

Do not accept fake local login.

24. PHASE 9 — AUTHORIZATION

Test:

Elder A
Guardian A
Elder B
Guardian B

Verify:

Guardian A cannot access Elder B
Guardian B cannot access Elder A
Elder cannot access Guardian endpoints

Do not trust client-provided IDs or roles.

25. PHASE 10 — REAL DATA SCREEN REPAIR

For every screen containing mock data:

identify the entity

inspect database

create/fix schema

create/fix backend

create/fix endpoint

create/fix API client

create/fix repository

create/fix state

replace mock data

test CRUD

test loading

test empty

test error

test offline where required

test synchronization

Repeat until no important screen uses fake data.

26. PHASE 11 — OFFLINE-FIRST

Verify actual offline behavior.

Test:

Internet ON
↓
Create/update data
↓
Internet OFF
↓
Create/update data
↓
Close app
↓
Open app
↓
Data still available
↓
Internet ON
↓
Sync
↓
PostgreSQL updated

Do not claim offline-first is complete without performing this kind of test.

27. PHASE 12 — SYNC ENGINE

Verify:

queue
priority
retry
idempotency
conflict handling
failure recovery

Emergency events must be prioritized.

Verify that retries do not create duplicate records.

28. PHASE 13 — EMERGENCY

Test the complete actual flow:

Detection
↓
Emergency screen
↓
Countdown
↓
Cancel / Confirm
↓
SQLite
↓
Sync Queue
↓
API
↓
Backend
↓
PostgreSQL
↓
Notification
↓
Guardian

Do not mark emergency complete because the emergency screen opens.

29. PHASE 14 — GUARDIAN

Verify that Guardian Dashboard is built from actual data.

No hardcoded:

3 medications
2 alerts
Green
Good
Last active

unless those values are actually calculated from the database.

30. PHASE 15 — NOTIFICATIONS

Verify real notification behavior.

Test:

FCM token
token refresh
foreground
background
terminated app
logout
re-login
emergency
Guardian notification

31. PHASE 16 — SCREEN STATES

Every real-data screen needs:

Loading
Success
Empty
Error
Offline
Syncing
Synced
Retry

Implement these states rather than documenting that they should exist.

32. PHASE 17 — TESTING

First discover the project's actual test commands.

Then run them.

Examples may include:

npm test
npm run test
npm run lint
npm run typecheck
npx tsc --noEmit

Use the actual package scripts.

Do NOT claim tests passed if you did not execute them.

33. TEST OUTPUT EVIDENCE

For every test suite record:

Command
Date/time
Result
Passed
Failed
Skipped
Warnings

If a command fails:

FIX THE CODE AND RUN IT AGAIN.

Do not hide failures.

Do not change the test to make it pass unless the test itself is objectively incorrect.

34. TYPECHECK

Run typechecking separately for every relevant project.

For example:

npx tsc --noEmit

Do not report:

"0 TypeScript errors"

unless the command actually returned exit code 0.

35. BUILD VERIFICATION

Build the actual application.

Verify:

development build
release build
APK
AAB

Fix:

compile errors
native errors
environment errors
asset errors
configuration errors

36. REAL DEVICE TEST

If an Android device/emulator is available, install the build.

Actually test:

launch
login
navigation
database
API
offline
sync
notifications
emergency
logout

If real-device testing cannot be performed because the environment does not provide a device/emulator:

state that explicitly.

Do NOT claim it was tested.

37. PRODUCTION CONFIGURATION

Verify:

production API URL
production database
environment variables
secrets
Firebase
FCM
Android permissions
release signing
HTTPS

Never expose secrets.

Never commit production credentials.

38. FINAL UI AUDIT

After all data/backend work is complete, inspect every screen again.

Check:

Typography
Spacing
Colors
Cards
Buttons
Inputs
Headers
Navigation
Icons
Empty states
Error states
Loading
Offline
Accessibility

Fix remaining inconsistencies.

39. FINAL MOCK-DATA AUDIT

Run another complete search.

There must be no important production UI data coming from:

mockData
dummyData
fakeData
sampleData
hardcoded arrays
placeholder records

Exceptions must be explicitly documented, such as:

static UI labels
design constants
enumerations
configuration

40. FINAL API AUDIT

Run another API audit.

Every important screen must have a traceable data source.

For each screen answer:

Where does this data come from?

If the answer is:

"hardcoded in the component"

it is NOT production ready.

41. FINAL DATABASE AUDIT

Verify:

database reachable
migrations applied
seed data works
CRUD works
relationships work
transactions work

42. FINAL PRODUCTION READINESS AUDIT

Only after actual implementation and testing create:

docs/FULL_APPLICATION_AUDIT.md
docs/PRODUCTION_READINESS_REPORT.md
docs/IMPLEMENTATION_STATUS.md

The report must distinguish:

VERIFIED
PARTIALLY VERIFIED
NOT VERIFIED
BLOCKED

Never convert "not tested" into "complete."

43. REQUIRED EVIDENCE TABLE

Create this table:

Area

Requirement

Verification Command/Test

Result

Evidence

Status

Frontend

All screens

Screen inventory







UI

Consistent design

Full screen review







Mock Data

Removed

Repository search







PostgreSQL

Connected

DB operation







SQLite

Offline persistence

Offline test







API

Connected

Endpoint test







Backend

Functional

Integration test







Auth

Working

Login/logout test







Authorization

Isolated

Cross-user test







Sync

Working

Offline→online test







Emergency

End-to-end

Emergency test







Notifications

Working

FCM test







Tests

Passing

Actual test command







Build

Release

Build command







44. STATUS DEFINITIONS

Use only:

VERIFIED

You actually tested it and have evidence.

PARTIALLY VERIFIED

Some components work, but complete end-to-end verification is missing.

NOT VERIFIED

You have not actually tested it.

BLOCKED

You cannot test/complete it because a required dependency/environment/access is unavailable.

Never use:

100% complete
production ready
done
fully verified

when important areas are merely inspected but not executed.

45. ABSOLUTE PROHIBITIONS

DO NOT:

invent test results

invent API responses

invent database records

invent successful builds

invent successful deployment

claim device testing without a device

claim FCM testing without actually testing FCM

claim PostgreSQL persistence without actual DB verification

claim SQLite persistence without actual offline testing

claim mock data is removed without repository-wide search

claim UI consistency without inspecting all screens

create documentation instead of fixing code

stop after producing an audit report

46. IF SOMETHING IS BROKEN

Do this:

Find
↓
Understand
↓
Fix
↓
Run
↓
Verify
↓
Document

NOT:

Find
↓
Document
↓
Claim complete

47. IF SOMETHING IS MISSING

Do this:

Determine requirement
↓
Design implementation
↓
Implement
↓
Connect
↓
Test

Do not simply write:

"This screen/API/table is missing."

Implement it.

48. IF SOMETHING CANNOT BE COMPLETED

Be explicit:

BLOCKED:
Reason:
Required dependency:
What has already been completed:
What remains:

Never hide blockers.

49. WORK IN ITERATIONS

Use this cycle:

AUDIT
↓
FIX
↓
TYPECHECK
↓
TEST
↓
BUILD
↓
RE-AUDIT

After each major subsystem:

Frontend
Backend
Database
API
Offline/Sync
Emergency
Guardian

run appropriate verification.

50. DO NOT BREAK EXISTING WORKING FEATURES

Before refactoring:

Understand dependency
Change
Run tests
Run typecheck
Verify related screens

If a previously working flow breaks, fix it before continuing.

51. FINAL ACCEPTANCE CRITERIA

The application can only be considered production-ready when all critical items are actually VERIFIED:

[ ] Complete screen inventory verified
[ ] All required screens implemented
[ ] All screens visually consistent
[ ] Shared design system applied
[ ] Elder navigation consistent
[ ] Guardian navigation consistent
[ ] Mock/dummy production data removed
[ ] Required development seed data created in database
[ ] PostgreSQL actually connected
[ ] PostgreSQL CRUD verified
[ ] SQLite actually connected
[ ] SQLite persistence verified
[ ] API endpoints actually tested
[ ] Backend services verified
[ ] Authentication verified
[ ] Authorization verified
[ ] Elder/Guardian isolation verified
[ ] Offline functionality verified
[ ] Sync verified
[ ] Duplicate sync prevention verified
[ ] Emergency end-to-end flow verified
[ ] Guardian data verified
[ ] FCM/notifications verified
[ ] Loading states verified
[ ] Empty states verified
[ ] Error states verified
[ ] Offline states verified
[ ] Accessibility reviewed
[ ] Localization reviewed
[ ] Security reviewed
[ ] Tests executed
[ ] Tests passing
[ ] Typecheck passing
[ ] Release build successful
[ ] Production configuration verified
[ ] Final repository-wide audit completed

52. FINAL INSTRUCTION

YOUR JOB IS TO MODIFY THE APPLICATION, NOT TO TELL ME THAT YOU MODIFIED IT.

If the application currently has:

50 screens
20 broken APIs
10 mock-data screens
5 database issues
inconsistent UI
broken sync

you must actually work through those issues.

Do not return a report claiming:

"All 50 screens are complete."

unless you have verified them.

Do not return:

"100% production ready."

unless every critical acceptance criterion has evidence.

53. START NOW

Begin with the actual repository.

Step 1

Inspect the complete project structure.

Step 2

Identify the actual frontend/backend/database architecture.

Step 3

Discover every screen.

Step 4

Inspect every screen's UI.

Step 5

Find every mock/hardcoded data source.

Step 6

Trace every important screen to its real data source.

Step 7

Audit PostgreSQL.

Step 8

Audit SQLite.

Step 9

Audit every API.

Step 10

Audit backend services.

Step 11

Audit authentication/authorization.

Step 12

Audit offline/sync.

Step 13

Audit Emergency.

Step 14

Audit Guardian.

Step 15

Create the shared design system.

Step 16

Repair all screens and UI inconsistencies.

Step 17

Replace mock data with actual database-backed data.

Step 18

Create database seed data where necessary.

Step 19

Fix APIs/backend/database.

Step 20

Fix offline/sync.

Step 21

Run actual tests.

Step 22

Fix every failure.

Step 23

Build release APK/AAB.

Step 24

Perform final UI + data + API + database + security audit.

Step 25

Only report what has actually been VERIFIED.

FINAL STANDARD

The final result must be:

A genuinely working SithaMithuru application — not a documented prototype, not a UI demo, not an application with fake data, and not a collection of claims.

Inspect the real code.Change the real code.Run the real tests.Verify the real database.Verify the real API.Verify the real application.Then report the truth.