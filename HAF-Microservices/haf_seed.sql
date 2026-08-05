-- =============================================================================
-- HAF Microservices -- PostgreSQL Seed Script
-- =============================================================================
--
-- Run with psql:
--   psql -U postgres -f haf_seed.sql
--
-- Databases created by this script:
--   identity_db    (identity-service,    port 5001)
--   program_db     (program-service,     port 5002)
--   club_db        (club-activity-service, port 5003)
--   family_db      (family-service,      port 5004)
--   booking_db     (booking-service,     port 5005)
--   attendance_db  (attendance-service,  port 5006)
--   compliance_db  (compliance-service,  port 5008)
--
-- NOTE: eligibility-service (5007), reporting-service (5009), and
--       notification-service (5010) are stateless -- no database.
--
-- SEED USER PASSWORDS
-- All 6 seed users have the password:  Test@1234
-- The PasswordHash values below are placeholder BCrypt hashes (cost 11).
-- They will NOT work for login. Replace them by either:
--   (a) POST /api/auth/register on identity-service to create real users, OR
--   (b) UPDATE "Users" SET "PasswordHash" = crypt('Test@1234', gen_salt('bf',11))
--       after enabling the pgcrypto extension.
-- =============================================================================

\c postgres

-- Drop existing databases (clean re-run)
DROP DATABASE IF EXISTS identity_db;
DROP DATABASE IF EXISTS program_db;
DROP DATABASE IF EXISTS club_db;
DROP DATABASE IF EXISTS family_db;
DROP DATABASE IF EXISTS booking_db;
DROP DATABASE IF EXISTS attendance_db;
DROP DATABASE IF EXISTS compliance_db;

-- Create all service databases
CREATE DATABASE identity_db;
CREATE DATABASE program_db;
CREATE DATABASE club_db;
CREATE DATABASE family_db;
CREATE DATABASE booking_db;
CREATE DATABASE attendance_db;
CREATE DATABASE compliance_db;


-- =============================================================================
-- 1. IDENTITY DB  (identity-service, port 5001)
-- Table: Users
-- =============================================================================
\c identity_db

CREATE TABLE "Users" (
    "Id"           text                    NOT NULL,
    "Email"        text                    NOT NULL,
    "FullName"     text                    NOT NULL,
    "Role"         character varying(32)   NOT NULL DEFAULT 'parent',
    "Phone"        text                    NOT NULL,
    "IsActive"     boolean                 NOT NULL DEFAULT true,
    "PasswordHash" text                    NOT NULL,
    "CreatedAt"    text                    NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

-- Roles: admin | council | club | parent
INSERT INTO "Users" ("Id", "Email", "FullName", "Role", "Phone", "IsActive", "PasswordHash", "CreatedAt") VALUES
(
    '00000000000000000000000000000001',
    'admin@haf.bradford.gov.uk',
    'HAF Administrator',
    'admin',
    '01274000001',
    true,
    '$2a$11$BVMjh7r2XgK9pN4qL0eWUu3FtCb2HsA1dGkHoMvEqBzRoPlJyWrSf',
    '2026-01-01T09:00:00+00:00'
),
(
    '00000000000000000000000000000002',
    'council@bradford.gov.uk',
    'Council Monitor',
    'council',
    '01274000002',
    true,
    '$2a$11$CWNki8s3YhL0qO5rM1fXVv4GuDc3JtB2eHmIpNwFrCvUoPmKzXsTe',
    '2026-01-01T09:05:00+00:00'
),
(
    '00000000000000000000000000000003',
    'manager@bradfordsports.co.uk',
    'Club One Manager',
    'club',
    '01274000003',
    true,
    '$2a$11$DXOlj9t4ZiM1rP6sN2gYWw5HvEd4KuC3fInJqOwGsDhRqNmLyUfRg',
    '2026-01-15T10:00:00+00:00'
),
(
    '00000000000000000000000000000004',
    'manager@idlecommunity.co.uk',
    'Club Two Manager',
    'club',
    '01274000004',
    true,
    '$2a$11$EYPmk0u5AjN2sQ7tO3hZXx6IwFe5LvD4gJoKrQxIuEjSrOoNzWhSh',
    '2026-01-15T10:30:00+00:00'
),
(
    '00000000000000000000000000000005',
    'sarah.johnson@email.com',
    'Sarah Johnson',
    'parent',
    '07700900001',
    true,
    '$2a$11$FZQnl1v6BkO3tR8uP4iAYy7JxGf6MwE5hJoLsQzJvFkUsSqPaXiTi',
    '2026-06-01T11:00:00+00:00'
),
(
    '00000000000000000000000000000006',
    'mohammed.khan@email.com',
    'Mohammed Khan',
    'parent',
    '07700900002',
    true,
    '$2a$11$GARom2w7ClP4uS9vQ5jBZz8KyHg7NxF6iKqMtRzKwGlVtTrQbYjUj',
    '2026-06-01T11:30:00+00:00'
);


-- =============================================================================
-- 2. PROGRAM DB  (program-service, port 5002)
-- Table: Cycles
-- =============================================================================
\c program_db

CREATE TABLE "Cycles" (
    "Id"          text                      NOT NULL,
    "Name"        text                      NOT NULL,
    "Description" text                      NOT NULL,
    "StartDate"   timestamp with time zone  NOT NULL,
    "EndDate"     timestamp with time zone  NOT NULL,
    "IsActive"    boolean                   NOT NULL DEFAULT true,
    "CreatedAt"   timestamp with time zone  NOT NULL,
    "UpdatedAt"   timestamp with time zone,
    CONSTRAINT "PK_Cycles" PRIMARY KEY ("Id")
);

INSERT INTO "Cycles" ("Id", "Name", "Description", "StartDate", "EndDate", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000101',
    'Summer HAF 2026',
    'Holiday Activity Fund programme for Summer 2026 covering 6 weeks of free activities for eligible children across Bradford district.',
    '2026-07-21 09:00:00+00',
    '2026-08-29 17:00:00+00',
    true,
    '2026-03-01 09:00:00+00',
    NULL
),
(
    '00000000000000000000000000000102',
    'Easter HAF 2026',
    'Holiday Activity Fund programme for Easter 2026 covering 2 weeks of free activities for eligible children across Bradford district.',
    '2026-04-07 09:00:00+00',
    '2026-04-18 17:00:00+00',
    false,
    '2026-02-01 09:00:00+00',
    '2026-04-19 09:00:00+00'
);


-- =============================================================================
-- 3. CLUB DB  (club-activity-service, port 5003)
-- Tables: Clubs, Activities
-- Note: Activities.CycleId references program_db -- stored as plain text (cross-service)
-- =============================================================================
\c club_db

CREATE TABLE "Clubs" (
    "Id"              text                      NOT NULL,
    "Name"            text                      NOT NULL,
    "Description"     text                      NOT NULL,
    "Address"         text                      NOT NULL,
    "ContactEmail"    text                      NOT NULL,
    "IsVisible"       boolean                   NOT NULL DEFAULT true,
    "ManagedByUserId" text,
    "CreatedAt"       timestamp with time zone  NOT NULL,
    "UpdatedAt"       timestamp with time zone,
    CONSTRAINT "PK_Clubs" PRIMARY KEY ("Id")
);

CREATE INDEX "IX_Clubs_ManagedByUserId" ON "Clubs" ("ManagedByUserId");

CREATE TABLE "Activities" (
    "Id"            text                      NOT NULL,
    "Title"         text                      NOT NULL,
    "Description"   text                      NOT NULL,
    "ClubProfileId" text                      NOT NULL,
    "CycleId"       text                      NOT NULL,
    "StartDateTime" timestamp with time zone  NOT NULL,
    "EndDateTime"   timestamp with time zone  NOT NULL,
    "Capacity"      integer                   NOT NULL,
    "IsActive"      boolean                   NOT NULL DEFAULT true,
    "CreatedAt"     timestamp with time zone  NOT NULL,
    "UpdatedAt"     timestamp with time zone,
    CONSTRAINT "PK_Activities" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Activities_Clubs_ClubProfileId"
        FOREIGN KEY ("ClubProfileId") REFERENCES "Clubs" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Activities_ClubProfileId" ON "Activities" ("ClubProfileId");

INSERT INTO "Clubs" ("Id", "Name", "Description", "Address", "ContactEmail", "IsVisible", "ManagedByUserId", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000201',
    'Bradford Sports Centre',
    'A community sports facility offering a wide range of activities for children and young people during school holidays.',
    'Britannia Street, Bradford, BD1 2AA',
    'manager@bradfordsports.co.uk',
    true,
    '00000000000000000000000000000003',
    '2026-01-15 10:00:00+00',
    NULL
),
(
    '00000000000000000000000000000202',
    'Idle Community Hub',
    'A vibrant community space in Idle village hosting arts, crafts and educational activities for families.',
    '21 High Street, Idle, Bradford, BD10 8NL',
    'manager@idlecommunity.co.uk',
    true,
    '00000000000000000000000000000004',
    '2026-01-15 10:30:00+00',
    NULL
),
(
    '00000000000000000000000000000203',
    'Shipley Arts Club',
    'Creative arts and crafts club for children, specialising in visual arts, music and performance.',
    '5 Manor Lane, Shipley, Bradford, BD18 3LT',
    'info@shipleyarts.co.uk',
    true,
    NULL,
    '2026-01-20 11:00:00+00',
    NULL
);

INSERT INTO "Activities" ("Id", "Title", "Description", "ClubProfileId", "CycleId", "StartDateTime", "EndDateTime", "Capacity", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000301',
    'Football Camp',
    'A fun and energetic football camp for children aged 5-16. Sessions include skills training, drills and small-sided games. Qualified FA coaches in attendance.',
    '00000000000000000000000000000201',
    '00000000000000000000000000000101',
    '2026-07-28 09:00:00+00',
    '2026-07-28 15:00:00+00',
    20,
    true,
    '2026-03-10 09:00:00+00',
    NULL
),
(
    '00000000000000000000000000000302',
    'Swimming Lessons',
    'Free swimming lessons for children of all abilities aged 5-14. Beginners and improver groups available. All equipment provided. ASA-qualified instructors.',
    '00000000000000000000000000000201',
    '00000000000000000000000000000101',
    '2026-07-29 09:00:00+00',
    '2026-07-29 12:00:00+00',
    15,
    true,
    '2026-03-10 09:30:00+00',
    NULL
),
(
    '00000000000000000000000000000303',
    'Arts & Crafts Workshop',
    'Creative arts and crafts workshop for children aged 4-12. Activities include painting, collage, clay modelling and more. All materials provided.',
    '00000000000000000000000000000202',
    '00000000000000000000000000000101',
    '2026-07-30 10:00:00+00',
    '2026-07-30 14:00:00+00',
    25,
    true,
    '2026-03-12 10:00:00+00',
    NULL
),
(
    '00000000000000000000000000000304',
    'Cooking for Kids',
    'Fun cooking workshop teaching children aged 8-14 basic culinary skills. Learn to prepare healthy, nutritious meals. Ingredients and equipment provided.',
    '00000000000000000000000000000203',
    '00000000000000000000000000000101',
    '2026-07-31 10:00:00+00',
    '2026-07-31 13:00:00+00',
    12,
    true,
    '2026-03-15 11:00:00+00',
    NULL
);


-- =============================================================================
-- 4. FAMILY DB  (family-service, port 5004)
-- Tables: Parents, Children, Carers
-- Note: Parents.UserId references identity_db -- stored as plain text (cross-service)
-- =============================================================================
\c family_db

CREATE TABLE "Parents" (
    "Id"        text                      NOT NULL,
    "FullName"  text                      NOT NULL,
    "Email"     text                      NOT NULL,
    "Phone"     text                      NOT NULL,
    "UserId"    text,
    "CreatedAt" timestamp with time zone  NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_Parents" PRIMARY KEY ("Id")
);

CREATE INDEX "IX_Parents_UserId" ON "Parents" ("UserId");

CREATE TABLE "Children" (
    "Id"               text                      NOT NULL,
    "FullName"         text                      NOT NULL,
    "DateOfBirth"      timestamp with time zone  NOT NULL,
    "UPN"              text,
    "FsmEligible"      boolean                   NOT NULL DEFAULT false,
    "FsmVerified"      boolean                   NOT NULL DEFAULT false,
    "ParentGuardianId" text                      NOT NULL,
    "CreatedAt"        timestamp with time zone  NOT NULL,
    "UpdatedAt"        timestamp with time zone,
    CONSTRAINT "PK_Children" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Children_Parents_ParentGuardianId"
        FOREIGN KEY ("ParentGuardianId") REFERENCES "Parents" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Children_ParentGuardianId" ON "Children" ("ParentGuardianId");

CREATE TABLE "Carers" (
    "Id"        text                      NOT NULL,
    "FullName"  text                      NOT NULL,
    "Email"     text                      NOT NULL,
    "Phone"     text                      NOT NULL,
    "ChildId"   text                      NOT NULL,
    "CreatedAt" timestamp with time zone  NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_Carers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Carers_Children_ChildId"
        FOREIGN KEY ("ChildId") REFERENCES "Children" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Carers_ChildId" ON "Carers" ("ChildId");

INSERT INTO "Parents" ("Id", "FullName", "Email", "Phone", "UserId", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000401',
    'Sarah Johnson',
    'sarah.johnson@email.com',
    '07700900001',
    '00000000000000000000000000000005',
    '2026-06-01 11:00:00+00',
    NULL
),
(
    '00000000000000000000000000000402',
    'Mohammed Khan',
    'mohammed.khan@email.com',
    '07700900002',
    '00000000000000000000000000000006',
    '2026-06-01 11:30:00+00',
    NULL
);

INSERT INTO "Children" ("Id", "FullName", "DateOfBirth", "UPN", "FsmEligible", "FsmVerified", "ParentGuardianId", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000501',
    'Emily Johnson',
    '2018-03-15 00:00:00+00',
    'U2026001001',
    true,
    true,
    '00000000000000000000000000000401',
    '2026-06-01 11:05:00+00',
    NULL
),
(
    '00000000000000000000000000000502',
    'Oliver Johnson',
    '2015-07-22 00:00:00+00',
    'U2026001002',
    false,
    false,
    '00000000000000000000000000000401',
    '2026-06-01 11:06:00+00',
    NULL
),
(
    '00000000000000000000000000000503',
    'Aisha Khan',
    '2017-11-05 00:00:00+00',
    'U2026002001',
    true,
    true,
    '00000000000000000000000000000402',
    '2026-06-01 11:35:00+00',
    NULL
),
(
    '00000000000000000000000000000504',
    'Zain Khan',
    '2019-09-12 00:00:00+00',
    NULL,
    false,
    false,
    '00000000000000000000000000000402',
    '2026-06-01 11:36:00+00',
    NULL
);

INSERT INTO "Carers" ("Id", "FullName", "Email", "Phone", "ChildId", "CreatedAt", "UpdatedAt") VALUES
(
    '00000000000000000000000000000601',
    'David Johnson',
    'david.johnson@email.com',
    '07700900003',
    '00000000000000000000000000000501',
    '2026-06-01 11:10:00+00',
    NULL
),
(
    '00000000000000000000000000000602',
    'Fatima Khan',
    'fatima.khan@email.com',
    '07700900004',
    '00000000000000000000000000000503',
    '2026-06-01 11:40:00+00',
    NULL
);


-- =============================================================================
-- 5. BOOKING DB  (booking-service, port 5005)
-- Table: Bookings
-- All child/activity fields are denormalised copies (cross-service, no FK)
-- =============================================================================
\c booking_db

CREATE TABLE "Bookings" (
    "Id"                    text                      NOT NULL,
    "ChildId"               text                      NOT NULL,
    "ChildName"             text                      NOT NULL,
    "ActivityId"            text                      NOT NULL,
    "ActivityTitle"         text                      NOT NULL,
    "ActivityStartDateTime" timestamp with time zone  NOT NULL,
    "ActivityEndDateTime"   timestamp with time zone  NOT NULL,
    "ActivityCapacity"      integer                   NOT NULL,
    "Status"                text                      NOT NULL DEFAULT 'Confirmed',
    "BookingReference"      text                      NOT NULL,
    "BookedAt"              timestamp with time zone  NOT NULL,
    "ConfirmedAt"           timestamp with time zone,
    "CancelledAt"           timestamp with time zone,
    "Notes"                 text,
    CONSTRAINT "PK_Bookings" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX "IX_Bookings_BookingReference" ON "Bookings" ("BookingReference");

-- Status values: Confirmed | Pending | Cancelled
INSERT INTO "Bookings" (
    "Id", "ChildId", "ChildName",
    "ActivityId", "ActivityTitle", "ActivityStartDateTime", "ActivityEndDateTime", "ActivityCapacity",
    "Status", "BookingReference", "BookedAt", "ConfirmedAt", "CancelledAt", "Notes"
) VALUES
(
    '00000000000000000000000000000701',
    '00000000000000000000000000000501', 'Emily Johnson',
    '00000000000000000000000000000301', 'Football Camp', '2026-07-28 09:00:00+00', '2026-07-28 15:00:00+00', 20,
    'Confirmed', 'HAF-2026-001', '2026-07-01 14:00:00+00', '2026-07-01 14:05:00+00', NULL, NULL
),
(
    '00000000000000000000000000000702',
    '00000000000000000000000000000502', 'Oliver Johnson',
    '00000000000000000000000000000302', 'Swimming Lessons', '2026-07-29 09:00:00+00', '2026-07-29 12:00:00+00', 15,
    'Confirmed', 'HAF-2026-002', '2026-07-01 14:10:00+00', '2026-07-01 14:15:00+00', NULL, NULL
),
(
    '00000000000000000000000000000703',
    '00000000000000000000000000000503', 'Aisha Khan',
    '00000000000000000000000000000303', 'Arts & Crafts Workshop', '2026-07-30 10:00:00+00', '2026-07-30 14:00:00+00', 25,
    'Confirmed', 'HAF-2026-003', '2026-07-01 14:20:00+00', '2026-07-01 14:25:00+00', NULL, NULL
),
(
    '00000000000000000000000000000704',
    '00000000000000000000000000000504', 'Zain Khan',
    '00000000000000000000000000000301', 'Football Camp', '2026-07-28 09:00:00+00', '2026-07-28 15:00:00+00', 20,
    'Pending', 'HAF-2026-004', '2026-07-05 09:00:00+00', NULL, NULL, 'Awaiting eligibility confirmation'
),
(
    '00000000000000000000000000000705',
    '00000000000000000000000000000501', 'Emily Johnson',
    '00000000000000000000000000000303', 'Arts & Crafts Workshop', '2026-07-30 10:00:00+00', '2026-07-30 14:00:00+00', 25,
    'Cancelled', 'HAF-2026-005', '2026-07-02 10:00:00+00', '2026-07-02 10:05:00+00', '2026-07-20 09:00:00+00', 'Duplicate booking - cancelled by parent'
);


-- =============================================================================
-- 6. ATTENDANCE DB  (attendance-service, port 5006)
-- Table: AttendanceRecords
-- BookingId has a UNIQUE index (one record per booking)
-- All IDs are cross-service references stored as plain text
-- =============================================================================
\c attendance_db

CREATE TABLE "AttendanceRecords" (
    "Id"               text                      NOT NULL,
    "BookingId"        text                      NOT NULL,
    "BookingReference" text                      NOT NULL,
    "ChildId"          text                      NOT NULL,
    "ActivityId"       text                      NOT NULL,
    "Attended"         boolean                   NOT NULL DEFAULT false,
    "Notes"            text,
    "RecordedAt"       timestamp with time zone  NOT NULL,
    CONSTRAINT "PK_AttendanceRecords" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX "IX_AttendanceRecords_BookingId" ON "AttendanceRecords" ("BookingId");

INSERT INTO "AttendanceRecords" ("Id", "BookingId", "BookingReference", "ChildId", "ActivityId", "Attended", "Notes", "RecordedAt") VALUES
(
    '00000000000000000000000000000801',
    '00000000000000000000000000000701',
    'HAF-2026-001',
    '00000000000000000000000000000501',
    '00000000000000000000000000000301',
    true,
    NULL,
    '2026-07-28 15:30:00+00'
),
(
    '00000000000000000000000000000802',
    '00000000000000000000000000000702',
    'HAF-2026-002',
    '00000000000000000000000000000502',
    '00000000000000000000000000000302',
    true,
    'Excellent participation throughout the session',
    '2026-07-29 12:30:00+00'
),
(
    '00000000000000000000000000000803',
    '00000000000000000000000000000703',
    'HAF-2026-003',
    '00000000000000000000000000000503',
    '00000000000000000000000000000303',
    false,
    'Child did not attend - parent notified via phone',
    '2026-07-30 14:30:00+00'
);


-- =============================================================================
-- 7. COMPLIANCE DB  (compliance-service, port 5008)
-- Table: DeletionRequests
-- RequestedByUserId references identity_db -- stored as plain text (cross-service)
-- =============================================================================
\c compliance_db

CREATE TABLE "DeletionRequests" (
    "Id"                  text                      NOT NULL,
    "SubjectType"         text                      NOT NULL,
    "SubjectId"           text                      NOT NULL,
    "RequestedByUserId"   text                      NOT NULL,
    "Reason"              text                      NOT NULL,
    "Status"              text                      NOT NULL DEFAULT 'Pending',
    "RequestedAt"         timestamp with time zone  NOT NULL,
    "ProcessedAt"         timestamp with time zone,
    CONSTRAINT "PK_DeletionRequests" PRIMARY KEY ("Id")
);

-- Status values: Pending | Approved | Rejected
-- SubjectType values: Child | ParentGuardian | AuthUser
INSERT INTO "DeletionRequests" ("Id", "SubjectType", "SubjectId", "RequestedByUserId", "Reason", "Status", "RequestedAt", "ProcessedAt") VALUES
(
    '00000000000000000000000000000901',
    'Child',
    '00000000000000000000000000000501',
    '00000000000000000000000000000001',
    'GDPR erasure request received from parent. Child data to be anonymised after current HAF cycle completes on 2026-08-29.',
    'Pending',
    '2026-07-25 10:00:00+00',
    NULL
),
(
    '00000000000000000000000000000902',
    'ParentGuardian',
    '00000000000000000000000000000402',
    '00000000000000000000000000000001',
    'Parent requested full data deletion following withdrawal from HAF programme. All associated child records reviewed and anonymised.',
    'Approved',
    '2026-07-10 09:00:00+00',
    '2026-07-15 14:00:00+00'
);


-- =============================================================================
-- Seed complete.
--
-- Summary of IDs for cross-referencing:
--
-- USERS (identity_db)
--   ...0001  admin@haf.bradford.gov.uk     (admin)
--   ...0002  council@bradford.gov.uk       (council)
--   ...0003  manager@bradfordsports.co.uk  (club)
--   ...0004  manager@idlecommunity.co.uk   (club)
--   ...0005  sarah.johnson@email.com       (parent)
--   ...0006  mohammed.khan@email.com       (parent)
--
-- CYCLES (program_db)
--   ...0101  Summer HAF 2026  [active]
--   ...0102  Easter HAF 2026  [inactive]
--
-- CLUBS (club_db)
--   ...0201  Bradford Sports Centre   (managed by ...0003)
--   ...0202  Idle Community Hub       (managed by ...0004)
--   ...0203  Shipley Arts Club        (unmanaged)
--
-- ACTIVITIES (club_db)
--   ...0301  Football Camp          Club ...0201, Cycle ...0101, cap 20
--   ...0302  Swimming Lessons       Club ...0201, Cycle ...0101, cap 15
--   ...0303  Arts & Crafts Workshop Club ...0202, Cycle ...0101, cap 25
--   ...0304  Cooking for Kids       Club ...0203, Cycle ...0101, cap 12
--
-- PARENTS (family_db)
--   ...0401  Sarah Johnson   (userId ...0005)
--   ...0402  Mohammed Khan   (userId ...0006)
--
-- CHILDREN (family_db)
--   ...0501  Emily Johnson  DOB 2018-03-15  FSM eligible  parent ...0401
--   ...0502  Oliver Johnson DOB 2015-07-22  not FSM       parent ...0401
--   ...0503  Aisha Khan     DOB 2017-11-05  FSM eligible  parent ...0402
--   ...0504  Zain Khan      DOB 2019-09-12  not FSM       parent ...0402
--
-- CARERS (family_db)
--   ...0601  David Johnson   (for child ...0501)
--   ...0602  Fatima Khan     (for child ...0503)
--
-- BOOKINGS (booking_db)
--   ...0701  HAF-2026-001  Emily  -> Football Camp      [Confirmed]
--   ...0702  HAF-2026-002  Oliver -> Swimming Lessons   [Confirmed]
--   ...0703  HAF-2026-003  Aisha  -> Arts & Crafts      [Confirmed]
--   ...0704  HAF-2026-004  Zain   -> Football Camp      [Pending]
--   ...0705  HAF-2026-005  Emily  -> Arts & Crafts      [Cancelled]
--
-- ATTENDANCE (attendance_db)
--   ...0801  HAF-2026-001  Emily  attended: YES
--   ...0802  HAF-2026-002  Oliver attended: YES
--   ...0803  HAF-2026-003  Aisha  attended: NO
--
-- DELETION REQUESTS (compliance_db)
--   ...0901  Child ...0501            Status: Pending
--   ...0902  ParentGuardian ...0402   Status: Approved
-- =============================================================================
