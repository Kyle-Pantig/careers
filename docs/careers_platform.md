# Careers Platform – Full‑Stack Web Application (Specification)

A full‑stack careers and recruitment platform built with **Next.js (latest)**, **Elysia.js (Bun backend)**, and **Supabase**, designed for scalability, automation, and clean separation of concerns.

---

## 1. Tech Stack Overview

### Frontend

* **Next.js (App Router, latest)**
* **TypeScript**
* **Tailwind CSS** (layout & utility styling)
* **Material UI (MUI)** (form controls, tables, dialogs)
* **Zustand or Redux Toolkit** (minimal global state)
* **TanStack React Query** (data fetching & caching)
* **React Hook Form + Zod** (form handling & validation)
* **NextAuth.js** (authentication client only)

### Backend

* **Bun runtime**
* **Elysia.js** (API & auth processing)
* **Supabase (PostgreSQL)** – database only (no Supabase Auth)
* **Resend** – transactional emails
* **Webhooks** – job syndication & integrations

---

## 2. Root Folder Structure

```
root/
├─ app/
│  ├─ (auth)/
│  ├─ (careers)/
│  ├─ (admin)/
│  └─ layout.tsx
│
├─ backend/
│  ├─ src/
│  ├─ plugins/
│  ├─ routes/
│  ├─ services/
│  ├─ jobs/
│  └─ index.ts
│
├─ shared/
│  ├─ types/
│  ├─ validators/
│  └─ constants/
│
├─ env/
├─ public/
└─ README.md
```

---

## 3. Frontend App Structure (Next.js)

### (auth) Folder

Used by both **careers** and **admin**.

**Pages**

* Login (email + password)
* Login with magic link / code (Resend)
* Sign up
* Email verification (token‑based)
* Forgot / Reset password

**Sign‑Up Requirements**

* First name
* Last name
* Valid email
* Password (hashed in backend)
* Email verification via token link

---

### (careers) Folder

#### Public Pages

* Landing page (hero, culture, benefits, CTA)
* Job listings
* Job details
* Search & filter

#### Job Search & Filters

* Industry
* Location
* Work type (Onsite / Remote / Hybrid)
* Keyword search

#### Apply to Job (Guest)

Required fields:

* First name
* Last name
* Email address
* Contact number
* Resume upload (PDF/DOC)
* Optional cover letter

**After submission:**

* Confirmation email sent to applicant
* Application visible in admin dashboard
* Application count updated per job

#### Apply to Job (Authenticated User)

* Auto‑fill user profile details
* Resume stored per user
* Faster application flow

#### Save Job (Guest → Auth Required)

* Guest prompted to log in or sign up
* Saved jobs linked to user account

---

### (admin) Folder

#### Dashboard

* Overview metrics

  * Total jobs
  * Total applications
  * Applications per job

#### Job Management

* Create / Edit / Archive job openings
* Set job visibility
* Assign industry, location, work type

#### Automation

* Schedule job postings
* Auto‑publish / auto‑expire jobs

#### Applications Management

* View applications per job
* Download resumes
* Update application status
* Internal notes

#### User & RBAC Management

**Roles**

* Admin
* Staff (Read)
* Staff (Edit)

**Permissions**

* Read only
* Edit jobs
* Manage applications
* Manage users

---

## 4. Authentication & Authorization

### Authentication Flow

* NextAuth used **only on frontend**
* Backend (Elysia) handles:

  * Credential verification
  * Token issuance
  * Role enforcement

### Login Methods

* Email + password
* Email login code (Resend)

### Email Verification

* Token‑based verification link
* Stored with expiry in database

### Admin Access Rule

* One valid admin email from `.env`
* First verified user with this email becomes super admin

---

## 5. Backend (Elysia.js – Bun)

### Core Responsibilities

* Authentication logic
* Role enforcement (RBAC)
* Business logic
* Email dispatch
* Automation jobs

### Backend Folder Structure

```
backend/
├─ routes/
│  ├─ auth.ts
│  ├─ jobs.ts
│  ├─ applications.ts
│  ├─ users.ts
│  └─ webhooks.ts
│
├─ services/
│  ├─ auth.service.ts
│  ├─ job.service.ts
│  ├─ email.service.ts
│  └─ rbac.service.ts
│
├─ jobs/
│  └─ scheduler.ts
│
├─ plugins/
│  ├─ supabase.ts
│  └─ resend.ts
│
└─ index.ts
```

---

## 6. Database (Supabase)

### Core Tables

* users
* roles
* user_roles
* jobs
* job_applications
* saved_jobs
* email_tokens
* login_codes
* job_schedules

### Application Tracking

* Track per job:

  * Total applicants
  * Guest vs registered users

---

## 7. Email System (Resend)

### Emails Sent

* Email verification
* Login code
* Application confirmation (applicant)
* New application alert (admin)

---

## 8. Automation & Scheduling

* Scheduled job posting
* Auto close jobs after deadline
* Cron‑like scheduler using Bun

---

## 9. Webhooks & Job Syndication

* Webhook triggers on:

  * Job published
  * Job updated
  * Job archived

* Used for:

  * External job boards
  * Analytics
  * HR tools

---

## 10. State & Data Management

* **Zustand or Redux Toolkit**: auth state, user session, preferences
* **React Query**:

  * Job listings
  * Job details
  * Applications
  * Admin dashboards

Minimal client state, backend‑driven logic.

---

## 11. Security Considerations

* Password hashing (bcrypt/argon2)
* File upload validation (resume)
* Role‑based route guards
* Token expiration handling
* Rate limiting on auth routes

---

## 12. Future Enhancements

* ATS integrations
* Resume parsing
* Interview scheduling
* Analytics dashboard
* Multi‑language support

---

**This document serves as the single source of truth for building the Careers Platform.**
