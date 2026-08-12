Act as a Principal Healthcare UX Architect, Chief Design Officer (CDO), Principal Product Designer, Healthcare Human Factors Engineer, Senior Mobile UX Strategist, Clinical Workflow Consultant, and Digital Health Design Expert with over 20 years of experience designing enterprise healthcare software. You have designed digital healthcare experiences comparable to Apple Health, Google Health, Medisafe, NHS Digital, Epic MyChart, Samsung Health, One Medical, and WHO digital healthcare systems. You are responsible for defining the Healthcare Design Philosophy that every future screen, interaction, workflow, and feature within the SithaMithuru application must follow. This is NOT a UI task. This is NOT a screen design task. This is the healthcare design philosophy document that governs the entire product. Everything must be written at enterprise documentation quality

guardian dashboard eke quality ekta guardian mode eke anith screens okkom create krnna. 

mta oni screens tmai

1. 1. Authentication Module
1.1 Guardian Welcome

Features

Guardian Mode introduction
Benefits overview
Login
Register
1.2 Guardian Login

Features

Email login
Password login
Remember me
Forgot password
1.3 Guardian Registration

Features

Full name
Email
Mobile number
Password
Confirm password
1.4 Email OTP Verification

Features

OTP verification
Resend OTP
Timer
1.5 Forgot Password

Features

Email verification
Reset link request
1.6 Reset Password

Features

New password
Confirm password
2. Guardian Dashboard
2.1 Dashboard Home

Features

Overall risk score
Elder summary
Quick actions
Recent alerts
Today's reminders
Last sync status
2.2 Dashboard Widgets

Features

Medication card
Mood card
Emergency card
Activity card
Battery status
Device connectivity
3. Elder Management
3.1 My Elders

Features

Linked elders
Search
Status indicator
3.2 Add Elder

Features

QR Code
Invite code
Manual link
3.3 Elder Details

Features

Personal info
Age
Contact
Medical summary
3.4 Edit Elder

Features

Update profile
Emergency contacts
4. Risk Monitoring
4.1 Risk Dashboard

Features

Green/Yellow/Red status
AI risk summary
Last analysis
4.2 Risk History

Features

Timeline
Daily risks
Weekly risks
4.3 Risk Details

Features

Trigger reason
Risk factors
Recommended action
5. Emergency Module
5.1 Emergency Alerts

Features

Live emergency alerts
Alert status
Priority
5.2 Emergency Details

Features

Audio keyword detected
Time
Location
Response history
5.3 Alert Response

Features

Acknowledge
Call elder
Notify others
5.4 Emergency History

Features

Previous emergencies
Search
Filter
6. Medication Monitoring
6.1 Medication Dashboard

Features

Today's medications
Missed medications
Compliance rate
6.2 Medication Details

Features

Medicine info
Schedule
Status
6.3 Medication History

Features

Daily history
Monthly history
6.4 Missed Medication

Features

Missed list
Guardian actions
7. Reminder Monitoring
7.1 Reminder Dashboard

Features

Active reminders
Completed reminders
7.2 Reminder History

Features

Reminder logs
Completion status
8. Daily Activity
8.1 Activity Dashboard

Features

Daily routine
Activity score
Inactivity alerts
8.2 Activity Timeline

Features

Timeline
Events
Daily summary
8.3 Activity Details

Features

Activity information
Duration
Notes
9. Notifications
9.1 Notification Center

Features

All notifications
Read/Unread
9.2 Notification Details

Features

Full notification
Actions
9.3 Notification Settings

Features

Enable/Disable
Categories
10. Analytics
10.1 Health Overview

Features

Weekly summary
Monthly summary
10.2 Medication Analytics

Features

Adherence graphs
Trends
10.3 Risk Analytics

Features

Risk trend
Statistics
10.4 Emergency Analytics

Features

Frequency
Response time
11. Reports
11.1 Reports Dashboard

Features

Available reports
Export
11.2 Report Details

Features

View report
Download PDF
12. Communication
12.1 Contact Elder

Features

Call
Message
12.2 Emergency Contacts

Features

Contact list
Quick call
13. Guardian Profile
13.1 Profile

Features

Personal details
Profile picture
13.2 Edit Profile

Features

Update profile
Change phone
13.3 Change Password

Features

Current password
New password
14. Settings
14.1 General Settings

Features

Language
Theme
Font size
14.2 Notification Settings

Features

Push notifications
Sound
Vibration
14.3 Privacy & Security

Features

Session management
Device management
Biometric login
14.4 Connected Devices

Features

Device list
Remove device
15. Help & Support
15.1 Help Center

Features

FAQs
Guides
15.2 Contact Support

Features

Email support
Live chat (future)
Feedback
15.3 About

Features

Version
Privacy Policy
Terms & Conditions
16. System Screens
16.1 Loading Screen
App initialization
Token validation
16.2 No Internet
Offline indicator
Retry
16.3 Maintenance
Server maintenance notice
16.4 Permission Required
Notification permission
Location permission (if used)
16.5 Session Expired
Re-login prompt
16.6 Error Screen
Unexpected error
Retry
16.7 Empty State
No data available


---

# Screen Quality Standards

Every Guardian screen must be designed to production-level quality suitable for a real healthcare application.

Do not produce simple student project screens.

Every screen should feel polished, modern, intuitive, and suitable for public release.

For every screen, consider and explain the following:

## User Experience

- Screen purpose
- Primary user goal
- Secondary user goals
- User journey
- Navigation flow
- Information hierarchy
- Visual hierarchy
- Cognitive load
- Accessibility
- Ease of use
- One-handed usability
- Error prevention
- Recovery from mistakes

---

## UI Quality

Ensure the screen has:

- Clean layout
- Consistent spacing
- Consistent typography
- Proper color usage
- Clear call-to-action buttons
- Well-structured cards
- Appropriate icons
- Meaningful illustrations where necessary
- Responsive layout
- Consistent component usage

Avoid visual clutter.

---

## Functional Completeness

Before considering a screen complete, verify that it includes all required functionality.

Consider:

- Primary actions
- Secondary actions
- Search
- Filtering
- Sorting
- Pagination (where applicable)
- Status indicators
- Progress indicators
- Confirmation dialogs
- Validation
- Success feedback
- Error handling
- Permission handling
- Offline support

No important functionality should be omitted.

---

## Data Integration

Never use:

- Dummy data
- Placeholder data
- Fake values
- Static lists
- Hardcoded records

All UI components must be designed around real production data retrieved from the PostgreSQL database through the backend APIs.

If a screen requires additional database entities, relationships, APIs, or backend logic, design and implement them as part of the workflow.

---

## Production Considerations

While designing every screen, consider:

- Performance
- Security
- Scalability
- Maintainability
- Reusability
- Offline-first behavior
- Data synchronization
- Push notifications
- Network failures
- Slow internet
- Empty datasets
- Large datasets
- Error scenarios
- Accessibility (WCAG AA)
- Healthcare UX best practices

Design for real-world usage, not ideal conditions.

---

## Component Reusability

Whenever possible, reuse existing components.

If a new reusable component is required:

- Explain why it is needed.
- Add it to the design system.
- Reuse it throughout the application.

Avoid creating duplicate components.

---

## Review Checklist

Before moving to the next screen, perform a complete review and verify:

- UX is complete.
- UI follows the design system.
- All required features are included.
- Database changes are completed.
- Backend implementation is completed.
- APIs are completed.
- React Native implementation is completed.
- Offline synchronization is completed.
- Push notifications are completed.
- Testing strategy is completed.
- Security considerations are addressed.
- Accessibility requirements are satisfied.
- Performance considerations are addressed.
- No dummy or mock data exists.
- The screen is production-ready.

Only after this review is successfully completed may development continue to the next screen.

---

# Complete Production Development Checklist

Every Guardian screen must be fully completed across all layers of the application before moving to the next screen.

The following areas must be considered and completed for every screen.

## 1. UX/UI Design

- User experience
- User interface
- Navigation
- Layout
- Design system
- Accessibility
- Loading states
- Empty states
- Error states
- Offline states
- Micro-interactions
- Responsive layout

---

## 2. Database

- Database schema
- Tables
- Columns
- Constraints
- Foreign keys
- Relationships
- Indexes
- Migrations
- Seed configuration (only where essential, never fake application data)

---

## 3. Backend

- Controllers
- Services
- Repositories (if applicable)
- Business logic
- Validation
- Authentication
- Authorization
- Exception handling
- Logging
- Configuration
- Dependency injection (if applicable)

---

## 4. API

- REST endpoints
- Request models
- Response models
- Error responses
- Status codes
- Pagination
- Filtering
- Sorting
- Search
- API versioning
- API documentation (OpenAPI/Swagger)

---

## 5. React Native

- Screen implementation
- Navigation
- Components
- State management
- Forms
- Validation
- API integration
- Error handling
- Performance optimization
- Accessibility

---

## 6. Local Storage & Offline Support

- SQLite schema
- Local repositories
- Sync queue
- Background synchronization
- Conflict resolution
- Retry mechanism
- Offline cache
- Offline indicators

---

## 7. Notifications

- Firebase Cloud Messaging (FCM)
- Local notifications
- Background notifications
- Notification permissions
- Notification handling
- Deep linking from notifications

---

## 8. Security

- JWT authentication
- Role-based authorization
- Secure API access
- Input validation
- SQL injection prevention
- XSS protection
- Sensitive data encryption
- Secure storage of tokens
- Privacy compliance

---

## 9. Performance

- Query optimization
- Lazy loading
- Efficient API calls
- Image optimization
- Caching strategy
- Memory optimization
- Render optimization

---

## 10. Error Handling

- Network failures
- API failures
- Validation errors
- Permission errors
- Authentication expiry
- Offline failures
- Unexpected exceptions
- User-friendly error messages

---

## 11. Testing

- Unit testing
- Integration testing
- API testing
- UI testing
- Offline testing
- Edge case testing
- Performance testing
- Security testing
- User acceptance testing (UAT)

---

## 12. Documentation

Update the project documentation for every completed screen.

Include:

- Database changes
- API documentation
- Architecture updates
- Component documentation
- Navigation updates
- Data flow
- Sequence diagrams (if required)
- Deployment notes (if affected)

---

## 13. Production Review

Before marking a screen as complete, verify:

✅ UX/UI completed

✅ Database completed

✅ Backend completed

✅ APIs completed

✅ React Native completed

✅ Local storage completed

✅ Offline synchronization completed

✅ Push notifications completed

✅ Security completed

✅ Performance optimized

✅ Error handling completed

✅ Testing completed

✅ Documentation updated

✅ Production Ready

Only after every checklist item has been completed and verified may development continue to the next Guardian screen.