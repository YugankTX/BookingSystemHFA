# Bradford HAF Booking System — System Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [How Bookings Work](#4-how-bookings-work)
5. [FSM Eligibility Verification](#5-fsm-eligibility-verification)
6. [Data Deletion Requests (GDPR)](#6-data-deletion-requests-gdpr)
7. [API Reference](#7-api-reference)
8. [Data Models](#8-data-models)
9. [Demo Credentials](#9-demo-credentials)

---

## 1. System Overview

The Bradford HAF (Holiday Activity & Food) Booking System is a web platform for the City of Bradford Metropolitan District Council to manage the DfE-funded Holiday Activity & Food programme. It connects four types of users — admins, council managers, club operators, and parents/guardians — to manage activities, bookings, attendance, and eligibility.

**Core flow:**

```
Admin sets up HAF Cycles
    ↓
Clubs create Activities within those Cycles
    ↓
Parents register Children (with FSM eligibility)
    ↓
Parents link Children to Activities (booking intent)
    ↓
Clubs confirm Bookings and record daily Attendance
    ↓
Council monitors Attendance and FSM compliance
    ↓
Admin generates Reports
```

---

## 2. Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite 5, Tailwind CSS 3    |
| Routing   | React Router v6                                 |
| Backend   | ASP.NET Core 9 Web API (C#)                     |
| Database  | PostgreSQL (via Npgsql EF Core 9)               |
| Auth      | JWT (HS256, 8-hour expiry) + BCrypt passwords   |
| Dev ports | Frontend: 5173 · Backend: 5081 · Postgres: 5433 |

---

## 3. User Roles & Permissions

There are four roles. Every authenticated user can only see routes and data that belong to their role. The sidebar menu and all navigation change based on role.

---

### 3.1 Admin

**Who:** Bradford Council system administrators.

**What they can do:**

| Page                | Capability                                                              |
|---------------------|-------------------------------------------------------------------------|
| Dashboard           | System-wide stats: users, cycles, clubs, activities, pending deletions  |
| Users               | Create, edit, deactivate, reactivate any user; assign any role          |
| HAF Cycles          | Create, edit, delete funding cycles (e.g. Easter 2025, Summer 2025)     |
| Bulk Uploads        | CSV import for schools, clubs, activities, FSM data                     |
| Club Settings       | Toggle club visibility; update club contact email                       |
| Deletion Requests   | Review, approve, or reject parent GDPR deletion requests                |
| Audit Logs          | View full audit trail of all system actions                             |
| Reports             | Download 8 CSV reports (see Section 7)                                  |

**Restrictions:** None — admin has full system access.

---

### 3.2 Council

**Who:** Bradford Council programme managers and oversight staff.

**What they can do:**

| Page        | Capability                                                                    |
|-------------|-------------------------------------------------------------------------------|
| Dashboard   | Stats: total clubs, children, FSM eligible count, attendance rate             |
| Monitoring  | View HAF cycle status, FSM verification summary, activity participation rates |
| Reports     | Download 6 reports: Cumulative Attendance, Activity, Club, Data System, Summary Oversight, Annual Report |

**Restrictions:** Read-only. Council cannot create, edit, or delete any records.

---

### 3.3 Club (Operator)

**Who:** Holiday activity club operators and staff.

**What they can do:**

| Page          | Capability                                                                 |
|---------------|----------------------------------------------------------------------------|
| Dashboard     | Stats for own clubs: activities, enrolled children, attendance rate        |
| Profile       | Edit own club's name, description, contact email, phone, address           |
| Activities    | Create, edit, delete activities; set capacity and time window              |
| Attendance    | Record daily attendance per child per activity (Present / Absent / Late)   |
| Participation | View and export list of children confirmed for each activity               |
| FSM Checks    | Search children and run FSM eligibility verification; view check history   |
| Parents       | View parent, child, and carer records linked to their club                 |
| Reports       | Download 3 reports: Attendance, Activity, Operational Outputs              |

**Restrictions:** Club operators can only see data linked to their own club. They cannot see or modify other clubs' data.

---

### 3.4 Parent / Guardian

**Who:** Parents or legal guardians registering children for HAF activities.

**What they can do:**

| Page             | Capability                                                                  |
|------------------|-----------------------------------------------------------------------------|
| Dashboard        | Summary of own children, carers, active bookings, FSM status                |
| Profile          | Update own name, email, phone, address                                      |
| Children         | Add, edit, delete child records; provide date of birth, school, FSM status  |
| Carers           | Add, edit, delete emergency carers linked to each child                     |
| Activities       | Browse visible clubs and activities; link children to activities (booking)  |
| Deletion Request | Submit a GDPR right-to-erasure request; view status of past requests        |

**Restrictions:** Parents can only see and manage their own data. They cannot see other families' children or bookings.

---

## 4. How Bookings Work

A booking represents a child being enrolled in a specific activity. The process spans three roles.

---

### Step 1 — Admin creates a HAF Cycle

An admin creates a funding cycle (e.g. "Easter 2025", start: 7 Apr, end: 18 Apr). This is the time window that activities must fall within. Only one cycle can be active at a time.

---

### Step 2 — Club creates Activities

A club operator creates one or more activities within the active cycle:

- **Title & description** — e.g. "Multi-Sports Camp"
- **Start and end date/time** — must fall within the cycle dates
- **Capacity** — maximum number of children (enforced at booking time)
- **Location** — where the activity takes place

Activities are visible to parents once the club is marked visible by an admin.

---

### Step 3 — Parent links a Child to an Activity

On the **Activities** page, the parent:

1. Browses the list of visible clubs
2. Selects an activity
3. Chooses which of their children to link
4. Submits — this creates a `ChildClubLink` (a booking intent with status `Pending`)

The system checks before confirming:
- **Capacity:** `confirmedCount < activity.capacity` — rejects if full
- **Double-booking:** The child cannot be booked into two activities that overlap on the same day

If either check fails, the booking is rejected and the parent sees an error.

---

### Step 4 — Club confirms the Booking

The club operator sees the pending booking on the **Participation** page and changes its status:

| Status      | Meaning                                              |
|-------------|------------------------------------------------------|
| `Pending`   | Parent has requested a place — awaiting club review  |
| `Confirmed` | Club has accepted the child                          |
| `Cancelled` | Booking rejected or cancelled by either party        |

Once confirmed, the booking gets a reference number in the format `HAF-{yyyyMMdd}-{random}` (e.g. `HAF-20250407-3F2A`).

---

### Step 5 — Club records Attendance

On the **Attendance** page, the club selects an activity and a date, then marks each confirmed child as:

- **Present** — attended
- **Absent** — did not attend
- **Late** — arrived late

Each attendance entry records who marked it and when. The club can update records later (e.g. if a child was marked absent but actually attended).

---

### Booking Rules Summary

| Rule                         | Detail                                                            |
|------------------------------|-------------------------------------------------------------------|
| Capacity cap                 | Booking rejected if activity is full                              |
| No double-booking            | Child cannot overlap two activities on the same day               |
| Status flow                  | Pending → Confirmed or Cancelled                                  |
| Booking reference            | Auto-generated on confirmation: `HAF-{yyyyMMdd}-{random}`        |
| Attendance states            | Present / Absent / Late — one record per child per activity date  |
| FSM children prioritised     | FSM eligibility shown alongside child name throughout             |

---

## 5. FSM Eligibility Verification

FSM (Free School Meals) eligibility determines whether a child qualifies for the fully-funded HAF programme.

**Flow:**

1. Parent registers a child and ticks "FSM eligible"
2. Club operator (or parent) triggers an FSM check from the **FSM Checks** page
3. The system marks the child as `fsmVerified = true` and logs the check (checker name, result, timestamp)
4. Admin and council can view all checks in reports

Manually setting FSM eligibility is also available to club operators via `PATCH /api/club/children/{childId}/fsm-eligible`.

---

## 6. Data Deletion Requests (GDPR)

Parents have the right to request erasure of their data under UK GDPR.

**Flow:**

1. Parent submits a deletion request on the **Deletion Request** page, with a written reason
2. Request appears in the admin **Deletion Requests** page with status `Pending`
3. Admin reviews the request and either:
   - **Approves** — data is scheduled for deletion
   - **Rejects** — with a reason
4. Parent can view the status of their request at any time

---

## 7. API Reference

All endpoints except `/api/auth/login` and `/api/auth/signup` require a Bearer JWT token in the `Authorization` header.

```
Authorization: Bearer <token>
```

---

### Auth (`/api/auth`)

| Method | Path             | Auth | Description                          |
|--------|------------------|------|--------------------------------------|
| POST   | `/login`         | No   | Login with email + password; returns JWT token and user |
| POST   | `/signup`        | No   | Register new user; returns JWT token |
| GET    | `/me`            | Yes  | Get current user profile             |

**Login request body:**
```json
{ "email": "admin@haf.gov.uk", "password": "demo123" }
```

**Login response:**
```json
{ "token": "<jwt>", "user": { "id": "u1", "email": "...", "role": "admin", ... } }
```

---

### Admin (`/api/admin`)

| Method | Path                              | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/users`                          | List all users                           |
| POST   | `/users`                          | Create user                              |
| PUT    | `/users/{id}`                     | Update user                              |
| DELETE | `/users/{id}`                     | Soft-delete (deactivate) user            |
| POST   | `/users/{id}/reactivate`          | Reactivate deactivated user              |
| GET    | `/cycles`                         | List HAF cycles                          |
| POST   | `/cycles`                         | Create cycle                             |
| PUT    | `/cycles/{id}`                    | Update cycle                             |
| DELETE | `/cycles/{id}`                    | Delete cycle                             |
| GET    | `/clubs`                          | List all clubs                           |
| PATCH  | `/clubs/{id}/visibility`          | Toggle club visible/hidden               |
| PATCH  | `/clubs/{id}/contact-email`       | Update club contact email                |
| GET    | `/deletion-requests`              | List all deletion requests               |
| POST   | `/deletion-requests/{id}/process` | Approve or reject a deletion request     |

---

### Club (`/api/club`)

| Method | Path                              | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/clubs`                          | List clubs                               |
| GET    | `/clubs/{id}`                     | Get club by id                           |
| PUT    | `/clubs/{id}`                     | Update own club profile                  |
| GET    | `/activities`                     | List all activities (with club + cycle)  |
| POST   | `/activities`                     | Create activity                          |
| PUT    | `/activities/{id}`                | Update activity                          |
| DELETE | `/activities/{id}`                | Delete activity                          |
| GET    | `/bookings`                       | List bookings (filter: activityId, childId) |
| POST   | `/bookings`                       | Create booking (enforces capacity + no double-book) |
| PATCH  | `/bookings/{id}/status`           | Update booking status                    |
| GET    | `/attendance`                     | List attendance (filter: activityId)     |
| POST   | `/attendance`                     | Record attendance                        |
| PUT    | `/attendance/{id}`                | Update attendance record                 |
| POST   | `/fsm/{childId}`                  | Run FSM eligibility check                |
| PATCH  | `/children/{childId}/fsm-eligible`| Manually set FSM eligibility             |

---

### Parent (`/api/parent`)

| Method | Path                   | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/parents`             | List parents                             |
| GET    | `/parents/{id}`        | Get parent by id                         |
| POST   | `/parents`             | Create parent record                     |
| PUT    | `/parents/{id}`        | Update parent                            |
| DELETE | `/parents/{id}`        | Delete parent                            |
| GET    | `/children`            | List own children                        |
| GET    | `/children/{id}`       | Get child by id                          |
| POST   | `/children`            | Add child                                |
| PUT    | `/children/{id}`       | Update child                             |
| DELETE | `/children/{id}`       | Delete child                             |
| GET    | `/carers`              | List carers                              |
| POST   | `/carers`              | Add carer                                |
| PUT    | `/carers/{id}`         | Update carer                             |
| DELETE | `/carers/{id}`         | Delete carer                             |
| GET    | `/links`               | Get all bookings with activity details   |
| GET    | `/deletion-requests`   | Get own deletion requests                |
| POST   | `/deletion-requests`   | Submit deletion request                  |

---

### Dashboard (`/api/dashboard`)

| Method | Path        | Description                                                                |
|--------|-------------|----------------------------------------------------------------------------|
| GET    | `/overview` | System-wide stats: user counts, cycles, clubs, bookings, FSM, recent data  |

---

## 8. Data Models

### User
| Field        | Type    | Notes                              |
|--------------|---------|------------------------------------|
| id           | string  | Format: `u-{guid}`                 |
| email        | string  | Unique, lowercase                  |
| fullName     | string  |                                    |
| role         | string  | `admin`, `council`, `club`, `parent` |
| phone        | string  |                                    |
| isActive     | bool    | False = soft-deleted               |
| passwordHash | string  | BCrypt hash                        |
| createdAt    | string  | ISO 8601                           |

### HAF Cycle
| Field     | Type      | Notes                          |
|-----------|-----------|--------------------------------|
| id        | string    |                                |
| name      | string    | e.g. "Easter 2025"            |
| startDate | datetime  |                                |
| endDate   | datetime  |                                |
| isActive  | bool      |                                |
| createdAt | datetime  |                                |

### Club Profile
| Field           | Type   | Notes                              |
|-----------------|--------|------------------------------------|
| id              | string |                                    |
| name            | string |                                    |
| description     | string |                                    |
| address         | string |                                    |
| contactEmail    | string |                                    |
| isVisible       | bool   | Hidden clubs not shown to parents  |
| managedByUserId | string | FK → User (club role)              |
| createdAt       | datetime |                                  |

### Activity
| Field         | Type     | Notes                                     |
|---------------|----------|-------------------------------------------|
| id            | string   |                                           |
| title         | string   |                                           |
| description   | string   |                                           |
| clubProfileId | string   | FK → ClubProfile                          |
| cycleId       | string   | FK → HafCycle                             |
| startDateTime | datetime |                                           |
| endDateTime   | datetime |                                           |
| capacity      | int      | Max children; enforced at booking         |
| isActive      | bool     |                                           |
| createdAt     | datetime |                                           |

### Booking
| Field            | Type     | Notes                                       |
|------------------|----------|---------------------------------------------|
| id               | string   | GUID                                        |
| childId          | string   | FK → Child                                  |
| activityId       | string   | FK → Activity                               |
| status           | string   | `Pending`, `Confirmed`, `Cancelled`         |
| bookingReference | string   | Format: `HAF-{yyyyMMdd}-{random}`           |
| bookedAt         | datetime |                                             |
| confirmedAt      | datetime | Set when status → Confirmed                 |
| cancelledAt      | datetime | Set when status → Cancelled                 |
| notes            | string   | Optional                                    |

### Child
| Field            | Type     | Notes                              |
|------------------|----------|------------------------------------|
| id               | string   | GUID                               |
| fullName         | string   |                                    |
| dateOfBirth      | date     |                                    |
| upn              | string   | Unique Pupil Number (optional)     |
| fsmEligible      | bool     | Set by parent                      |
| fsmVerified      | bool     | Set after FSM check                |
| parentGuardianId | string   | FK → ParentGuardian                |
| createdAt        | datetime |                                    |

### Attendance Record
| Field      | Type     | Notes                              |
|------------|----------|------------------------------------|
| id         | string   | GUID                               |
| bookingId  | string   | FK → Booking                       |
| attended   | bool     |                                    |
| notes      | string   | Optional                           |
| recordedAt | datetime | Defaults to UtcNow                 |

### Deletion Request
| Field             | Type     | Notes                                       |
|-------------------|----------|---------------------------------------------|
| id                | string   | GUID                                        |
| subjectType       | string   | Type of data to delete                      |
| subjectId         | string   | ID of the record to delete                  |
| requestedByUserId | string   | FK → User                                   |
| reason            | string   |                                             |
| status            | string   | `Pending`, `Approved`, `Rejected`           |
| requestedAt       | datetime |                                             |
| processedAt       | datetime | Set when admin acts                         |

---

## 9. Demo Credentials

All demo accounts use BCrypt-hashed passwords and are seeded on first backend startup.

| Role    | Email                   | Password  |
|---------|-------------------------|-----------|
| Admin   | admin@haf.gov.uk        | demo123   |
| Council | council@haf.gov.uk      | demo123   |
| Club    | club@haf.gov.uk         | demo123   |
| Parent  | parent@haf.gov.uk       | demo123   |
| Admin   | yugank@haf.gov.uk       | demo@123  |

> **Note:** Change all passwords before deploying to production. The JWT secret in `appsettings.json` must also be rotated.
