# Job Alerts Feature Plan

## Overview
Allow users and guest visitors to subscribe to job alerts and receive email notifications when new jobs matching their preferences are posted.

---

## Features

### 1. Email Subscription
- **Guest users**: Enter email to subscribe (no account required)
- **Authenticated users**: One-click subscribe using their account email

### 2. Subscription Preferences
- **All new jobs**: Receive alerts for all new job postings
- **By Industry**: Select specific industries (e.g., Technology, Healthcare)
- **By Location**: Select preferred locations
- **By Work Type**: Filter by Remote, Onsite, or Hybrid

### 3. Email Notifications
- **Instant notification**: Send email immediately when new job matches preferences
- **Unsubscribe link**: Easy one-click unsubscribe in every email

---

## Database Schema

```prisma
model JobSubscription {
  id            String    @id @default(uuid()) @db.Uuid
  email         String
  userId        String?   @db.Uuid  // Optional: linked to user account
  user          User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Preferences (empty arrays = all/any)
  industries    String[]  @default([])  // Industry IDs, empty = all industries
  locations     String[]  @default([])  // Location strings, empty = all locations
  workTypes     String[]  @default([])  // ONSITE, REMOTE, HYBRID, empty = all types
  
  // Status
  isActive      Boolean   @default(true)
  
  // Unsubscribe
  unsubscribeToken   String   @unique @default(uuid())
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([email])
  @@map("job_subscriptions")
}
```

---

## API Endpoints

### Backend Routes (`backend/src/routes/subscriptions.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/subscriptions` | Create new subscription |
| `GET` | `/subscriptions/:id` | Get subscription details |
| `PATCH` | `/subscriptions/:id` | Update subscription preferences |
| `DELETE` | `/subscriptions/:id` | Unsubscribe |
| `GET` | `/subscriptions/unsubscribe/:token` | One-click unsubscribe from email |

---

## Frontend Components

### 1. Subscription Form Component
**Location**: `components/careers/job-alert-form.tsx`

```tsx
// Features:
// - Email input (pre-filled for logged-in users)
// - Industry multi-select (optional)
// - Location multi-select (optional)
// - Work type checkboxes (optional)
// - Subscribe button
```

### 2. Subscription Modal/Section
**Locations**:
- `/jobs` page - "Get Job Alerts" CTA section
- `/jobs/[jobNumber]` page - "Get notified of similar jobs" card
- Footer - Newsletter subscription

### 3. Manage Subscriptions
- **Authenticated users**: Manage in profile page (`/profile`) - add Job Alerts section
- **Guest users**: Access via link in email → `app/(careers)/manage-alerts/[token]/page.tsx`

---

## Email Template

### New Job Alert Email
```
Subject: New job alert: {Job Title}

A new job matching your preferences has been posted!

{Job Title}
{Location} • {Work Type} • {Industry}

{Brief Description}

[View Job Details Button]

---
You're receiving this because you subscribed to job alerts.
[Unsubscribe] | [Manage Preferences]
```

---

## Implementation Tasks

### Phase 1: Core Setup
- [ ] Create `JobSubscription` model in Prisma schema
- [ ] Run database migration
- [ ] Create subscription API routes
- [ ] Create new job alert email template

### Phase 2: Frontend
- [ ] Create `JobAlertForm` component
- [ ] Add subscription section to `/jobs` page
- [ ] Add subscription CTA to single job page
- [ ] Create subscription success toast/message
- [ ] Create unsubscribe page

### Phase 3: Notification System
- [ ] Hook into job publish API to trigger alerts
- [ ] Match new job against subscriber preferences
- [ ] Send instant email notification to matching subscribers
- [ ] Add rate limiting to prevent spam

> **Note**: Alerts are triggered only when jobs are published via the API/dashboard, NOT when seeding directly to the database.

### Phase 4: User Management
- [ ] Add "Job Alerts" section to profile page (`/profile`)
- [ ] Link subscription to user account when logged in
- [ ] Create guest manage alerts page (`/manage-alerts/[token]`)
- [ ] Allow updating/deleting preferences

---

## Technical Considerations

### Email Sending
- Use **Resend** (already integrated) for transactional emails
- Implement queue system for bulk sending (digest emails)
- Rate limit: Max 1 email per job per subscriber per day

### When Alerts Trigger
Alerts are sent when:
- ✅ A job is **published** via admin dashboard (new job with `isPublished: true`)
- ✅ An existing draft job is **toggled to published**

Alerts are NOT sent when:
- ❌ Jobs are seeded directly to database (`prisma db seed`)
- ❌ A draft job is created (`isPublished: false`)
- ❌ A published job is updated (only new publications)

### Security
- Include unsubscribe token in all emails
- Rate limit subscription creation (prevent spam)
- Honeypot field for bot prevention
- Validate email format before saving

### Performance
- Batch email sending for large subscriber lists
- Index database queries by `isActive`, `frequency`, and preferences
- Cache industry/location options

---

## UI/UX Mockup

### Job Alerts Section on /jobs page
```
┌─────────────────────────────────────────────────┐
│  🔔 Never Miss a Job Opportunity                │
│                                                 │
│  Get notified when new jobs matching your       │
│  preferences are posted.                        │
│                                                 │
│  [email@example.com          ] [Subscribe]      │
│                                                 │
│  ☐ Technology  ☐ Healthcare  ☐ Finance          │
│  ☐ Remote only                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Future Enhancements
- SMS notifications (optional)
- Push notifications (PWA)
- Saved search alerts
- Salary range filtering
- Experience level filtering
- AI-powered job matching

---

## Timeline Estimate
- **Phase 1**: 1-2 hours
- **Phase 2**: 2-3 hours
- **Phase 3**: 1-2 hours
- **Phase 4**: 1 hour

**Total**: ~5-8 hours
