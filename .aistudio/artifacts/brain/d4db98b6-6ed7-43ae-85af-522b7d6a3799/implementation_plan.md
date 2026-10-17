# Hospital Management System (Supabase PostgreSQL + React + Express)

A multi-role hospital management web application built for local development on Debian 13 Linux, featuring role-based portals for Admins, Doctors, Receptionists, and Patients. Powered by an Express REST API backend, Prisma ORM, and a hosted Supabase PostgreSQL database with zero paid dependencies.

> [!IMPORTANT]
> **Environment Inspection & Supabase Setup Status:**
> - **Workspace Inspected**: Debian Linux environment running Node.js `v22.23.3`, npm `10.9.9`, Git `2.34.1`.
> - **Database Status**: No `.env` or Supabase database credentials currently exist in the environment. To connect Supabase, you will create a free Supabase project and provide the PostgreSQL connection URI (or direct URI) in `.env`.
> - **Dual Server Strategy**: The application supports both a unified dev server on port 3000 (with Express serving `/api/*` and Vite middleware serving the frontend for seamless AI Studio preview) and standalone mode (Express on 5000, Vite on 5173).
> - **Zero Cloud Resources Created**: As requested, no cloud resources or deployments have been or will be initiated without explicit approval.

---

## Environment & Workspace Inspection Report (Section 18)

1. **Current Working Directory**: `/` (Container working directory `/app/applet`).
2. **Existing Project Files**:
   - Configuration: `package.json`, `tsconfig.json`, `vite.config.ts`, `metadata.json`, `.env.example`, `.gitignore`, `bun.lock`.
   - Frontend: `index.html`, `src/App.tsx`, `src/main.tsx`, `src/index.css`.
3. **Runtime & Tool Versions**:
   - Node.js: `v22.23.3` (LTS)
   - npm: `10.9.9`
   - Git: `2.34.1`
4. **Existing Dependencies**:
   - `react` (^19.0.1), `react-dom` (^19.0.1), `vite` (^8.3.0), `express` (^4.21.2), `dotenv` (^17.2.3), `lucide-react` (^0.546.0), `motion` (^12.23.24), `@tailwindcss/vite` (^4.3.3), `tailwindcss` (^4.3.3), `tsx` (^4.21.0), `typescript` (^7.0.2).
5. **Available Relevant Tools**:
   - Node.js/tsx runtime execution for fullstack TypeScript.
   - Prisma CLI engine support (`prisma`, `@prisma/client`).
   - Standard shell and build tools.
6. **Current Frontend & Backend Setup**:
   - Frontend: Minimal React 19 + Tailwind CSS v4 template in `src/`.
   - Backend: Express is installed in `package.json`, but no server entry point, API routes, or controllers exist yet.
7. **Supabase Configuration & Connectivity Status**:
   - Neither `.env` nor environment variables for `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_*` currently exist.
   - Database connection is **Not Configured**.
   - **Action Required**: Create a free Supabase project at [supabase.com](https://supabase.com), copy the Connection String from **Project Settings > Database > Connection string** (Transaction pooler on port 6543 or Session pooler / Direct on port 5432), and set `DATABASE_URL` in `.env`.
8. **Prisma Compatibility & Configuration**:
   - Prisma 6.x is fully compatible with Node 22, Express, and Supabase PostgreSQL.
   - Requires `prisma/schema.prisma` with `provider = "postgresql"` and `url = env("DATABASE_URL")` (plus optional `directUrl = env("DIRECT_URL")` for migration runner).
9. **Potential Port Conflicts**:
   - In the AI Studio preview environment, port 3000 is required for iframe web preview.
   - In local Debian 13 desktop environments, default configurations expect Vite on 5173 and Express on 5000.
   - **Resolution**: Provide a root `server.ts` that integrates Vite as Express middleware on port 3000 for unified execution, while also providing standalone scripts (`npm run dev:server` on 5000 and `npm run dev:client` on 5173) for classic dual-process local development.
10. **Proposed Architecture**: Layered 3-tier architecture: React + Tailwind CSS client → Express REST API (`/api/*`) → Prisma ORM → Supabase PostgreSQL.
11. **Proposed Database Schema**: 14 normalized relational entities (User, Patient, Doctor, Staff, Department, Appointment, MedicalRecord, Prescription, PrescriptionItem, Medicine, Bill, BillItem, Room, AuditLog) with strict foreign key integrity, enums, and indexing.
12. **Proposed Project Structure**:
    - `src/` (React frontend pages, components, context, hooks, layout)
    - `server/` (Express app, controllers, middlewares, routes, services, prisma client instance)
    - `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`)
13. **Missing Dependencies to Install**:
    - Backend: `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`, `cors`, `@types/cors`, `zod`.
    - Frontend: `react-router-dom`, `recharts`, `react-hook-form`, `@hookform/resolvers`, `clsx`, `tailwind-merge`.
14. **Potential Security & Compatibility Issues**:
    - Preventing leakage of secrets (`DATABASE_URL`, `JWT_SECRET`, service keys) to client bundles.
    - Strict role authorization on every backend endpoint (Doctor cannot view unrelated patients; Patient can only read own medical records).
    - Handling Supabase connection pooling and potential IPv4/IPv6 resolver quirks on Linux systems.
15. **Recommended First Implementation Phase**:
    - **Phase 1: Foundation & Prisma Setup**: Install required packages, configure `.env.example`, generate Prisma client and initial schema, set up Express health check and database test utility, establish connection verification.

---

## 1. Overview & Core Concept

The Hospital Management System is a comprehensive, HIPAA-inspired academic clinical portal designed to streamline outpatient and inpatient clinical workflows:
- **Role-Based Access**: 4 distinct roles:
  1. **Admin**: Global administration, staff management, departments, inventory, room allocation, system audit logs, and analytics.
  2. **Doctor**: Consultation queue, patient histories, clinical observations, diagnostic records, and digital prescription builder.
  3. **Receptionist**: Patient intake, appointment booking/rescheduling, doctor schedule availability, and billing invoice generation.
  4. **Patient**: Personal health dashboard, appointment history, past medical diagnoses, prescribed medicines, and billing statements.
- **Data Integrity**: Direct relation between consultations, diagnosis notes, prescribed medication items, and pharmacy inventory.
- **Simulated Financial Ledger**: Invoice generation with status lifecycle (`Pending`, `Paid`, `Cancelled`) without external payment APIs.

---

## 2. User Experience & Visual Design

Following the **Universal Frontend Design Constitution** and **SaaS & Enterprise Dashboard** guidelines:

### Layout Structure & Navigation
- **Workspace Layout**: Fixed 260px left sidebar with high-contrast active route indicators and role badge; sticky top bar with contextual breadcrumb navigation, current system time, demo account switcher, and user profile action; responsive fluid data viewport.
- **Single-Elevation Depth**: Clean, flat slate surfaces (`bg-slate-50` backdrop with `bg-white` cards and `border-slate-200` hairline dividers). Zero nested card clutter.
- **Zero-Pill Discipline**: Status labels (e.g., `Scheduled`, `Completed`, `Active`, `Paid`) use subtle typographic indicators with color-coded leading icons, not garish candy pills.

### Visual Identity & Palette
- **Primary Brand**: Clinical Deep Teal (`#0D9488` / `#0F766E`) conveying medical precision, cleanliness, and trust.
- **Secondary Surfaces**: Slate Gray (`#0F172A`, `#334155`, `#F8FAFC`, `#E2E8F0`).
- **Semantic Accents**:
  - Emerald (`#059669`): Completed appointments, normal lab results, paid invoices.
  - Amber (`#D97706`): Pending triage, room occupied, pending payment.
  - Rose (`#E11D48`): Critical patient flags, cancelled consultations, allergic reactions.
- **Typography**: `Plus Jakarta Sans` for clean, professional UI headings and body prose; `font-mono tabular-nums` for timestamps, patient IDs, room numbers, dosage metrics, and financial amounts.

---

## 3. Key Product Decisions & Trade-Offs

1. **Prisma ORM with Supabase PostgreSQL**:
   - *Chosen Approach*: Standard Prisma Client generated from `prisma/schema.prisma`.
   - *Why*: Provides end-to-end type safety, migration tracking via Prisma Migrate, relational joins with zero SQL injection risk, and seamless switching between local PostgreSQL and hosted Supabase PostgreSQL.
   - *Connection Resilience*: Graceful fallback error reporting when database credentials are not yet configured in `.env`, displaying an actionable configuration banner in the UI rather than crashing the process.
2. **Authentication Model**:
   - *Chosen Approach*: Express-based JWT authentication with bcrypt password hashing (10 salt rounds) stored in `User` table, with tokens carried via `Authorization: Bearer <token>` or HTTP-only cookies.
   - *Why*: Meets the mandatory requirement of avoiding Supabase Auth dependencies, keeping authentication portable and self-contained.
3. **Local Development Port Strategy**:
   - *Chosen Approach*: Root `server.ts` capable of serving both Express API routes on `/api/*` and Vite frontend in development on port 3000, while also exposing standalone npm scripts for 5000 (Express) and 5173 (Vite).
   - *Why*: Ensures 100% compatibility with Google AI Studio's port 3000 iframe preview while preserving the exact dual-port development workflow requested in the prompt for local Debian terminal usage.
4. **Demonstration Accounts & Seeding**:
   - *Chosen Approach*: Safe upsert-based seed script (`prisma/seed.ts`) populating:
     - 4 demo accounts: `admin@hospital.local`, `doctor@hospital.local`, `reception@hospital.local`, `patient@hospital.local` (default dev password: `Password123!`).
     - 5+ doctors across Cardiology, Neurology, Pediatrics, Orthopedics, General Medicine.
     - 15+ realistic patients with blood groups, emergency contacts, and medical histories.
     - 20+ medicines with stock counts and unit prices.
     - 10+ hospital rooms (ICU, General Ward, Deluxe Private).
     - Connected appointments, medical records, prescriptions, and bills.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Browser / Client                          │
│          React 19 + TypeScript + Vite + Tailwind CSS + Lucide          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (JSON)
                                    │ Authorization: Bearer <JWT>
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Node.js + Express REST API Server                     │
│               (Port 3000 unified or Port 5000 standalone)              │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │    Auth Middleware   │  │    Zod Validators    │  │  Audit Logger│  │
│  │ (JWT & Role Guards)  │  │   (Request Payloads) │  │  Middleware  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └──────┬───────┘  │
│             │                         │                     │          │
│  ┌──────────▼─────────────────────────▼─────────────────────▼───────┐  │
│  │        Controllers & Route Handlers (/api/v1/*)                  │  │
│  │  - Auth       - Patients       - Doctors      - Appointments     │  │
│  │  - Records    - Prescriptions  - Rooms        - Billing          │  │
│  │  - Inventory  - Reports        - Audit Logs   - Health Check     │  │
│  └────────────────────────────────────┬─────────────────────────────┘  │
│                                       │                                │
│  ┌────────────────────────────────────▼─────────────────────────────┐  │
│  │                     Prisma ORM Client Layer                      │  │
│  └────────────────────────────────────┬─────────────────────────────┘  │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │ PostgreSQL Protocol (Port 5432 / 6543)
                                        │ SSL Mode: require
┌───────────────────────────────────────▼────────────────────────────────┐
│                      Supabase Hosted PostgreSQL                        │
│                   (or local PostgreSQL fallback)                       │
│                                                                        │
│  [User] ──< [Doctor] ────< [Appointment] >──── [Patient] >── [User]    │
│                 │                 │                 │                  │
│                 └──< [MedicalRecord] >──────────────┤                  │
│                             │                       │                  │
│                             └──< [Prescription] >───┤                  │
│                                         │           │                  │
│                                [PrescriptionItem]   └──< [Bill]        │
│                                         │                  │           │
│                                    [Medicine]          [BillItem]      │
│                                                                        │
│             [Department]   [Room]   [Staff]   [AuditLog]               │
└────────────────────────────────────────────────────────────────────────┘
```

### Relational Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  DOCTOR
  RECEPTIONIST
  PATIENT
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum BillStatus {
  PENDING
  PAID
  CANCELLED
  REFUNDED
}

enum RoomType {
  GENERAL_WARD
  SEMI_PRIVATE
  PRIVATE
  ICU
  EMERGENCY
  OPERATION_THEATRE
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  RESERVED
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  role         Role
  firstName    String
  lastName     String
  phoneNumber  String?
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  patient      Patient?
  doctor       Doctor?
  staff        Staff?
  auditLogs    AuditLog[]

  @@index([email])
  @@index([role])
}

model Department {
  id          String      @id @default(uuid())
  name        String      @unique
  code        String      @unique
  description String?
  location    String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  doctors     Doctor[]
  rooms       Room[]
}

model Doctor {
  id              String         @id @default(uuid())
  userId          String         @unique
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  departmentId    String
  department      Department     @relation(fields: [departmentId], references: [id])
  specialization  String
  licenseNumber   String         @unique
  consultationFee Float          @default(0.0)
  experienceYears Int            @default(0)
  bio             String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
  prescriptions   Prescription[]

  @@index([departmentId])
  @@index([specialization])
}

model Patient {
  id                   String          @id @default(uuid())
  userId               String?         @unique
  user                 User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  medicalRecordNumber  String          @unique // e.g. "MRN-2026-0001"
  firstName            String
  lastName             String
  dateOfBirth          DateTime
  gender               Gender
  bloodGroup           String?         // e.g. "O+", "A-"
  contactNumber        String
  emergencyContact     String?
  address              String?
  allergies            String?
  chronicConditions    String?
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt
  
  appointments         Appointment[]
  medicalRecords       MedicalRecord[]
  prescriptions        Prescription[]
  bills                Bill[]

  @@index([medicalRecordNumber])
  @@index([lastName, firstName])
}

model Staff {
  id            String      @id @default(uuid())
  userId        String      @unique
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  employeeId    String      @unique
  jobTitle      String
  shiftHours    String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Room {
  id            String      @id @default(uuid())
  roomNumber    String      @unique
  floor         Int
  type          RoomType
  status        RoomStatus  @default(AVAILABLE)
  dailyRate     Float
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Appointment {
  id             String            @id @default(uuid())
  appointmentNo  String            @unique
  patientId      String
  patient        Patient           @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId       String
  doctor         Doctor            @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  scheduledAt    DateTime
  timeSlot       String            // e.g. "10:30 AM"
  reasonForVisit String
  status         AppointmentStatus @default(SCHEDULED)
  vitalsNotes    String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  
  medicalRecord  MedicalRecord?

  @@index([patientId])
  @@index([doctorId])
  @@index([scheduledAt])
  @@index([status])
}

model MedicalRecord {
  id             String        @id @default(uuid())
  recordNumber   String        @unique
  patientId      String
  patient        Patient       @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId       String
  doctor         Doctor        @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  appointmentId  String?       @unique
  appointment    Appointment?  @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  chiefComplaint String
  diagnosis      String
  treatmentPlan  String
  clinicalNotes  String?
  labResults     String?
  recordedAt     DateTime      @default(now())
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  prescription   Prescription?

  @@index([patientId])
  @@index([doctorId])
  @@index([recordedAt])
}

model Medicine {
  id               String             @id @default(uuid())
  code             String             @unique
  name             String
  genericName      String?
  category         String             // e.g. "Antibiotic", "Analgesic"
  dosageForm       String             // e.g. "Tablet", "Syrup", "Injection"
  strength         String             // e.g. "500mg"
  unitPrice        Float
  stockQuantity    Int                @default(0)
  reorderLevel     Int                @default(20)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  
  prescriptionItems PrescriptionItem[]

  @@index([name])
}

model Prescription {
  id              String             @id @default(uuid())
  prescriptionNo  String             @unique
  patientId       String
  patient         Patient            @relation(fields: [patientId], references: [id], onDelete: Restrict)
  doctorId        String
  doctor          Doctor             @relation(fields: [doctorId], references: [id], onDelete: Restrict)
  medicalRecordId String?            @unique
  medicalRecord   MedicalRecord?     @relation(fields: [medicalRecordId], references: [id], onDelete: SetNull)
  generalAdvice   String?
  issuedAt        DateTime           @default(now())
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  items           PrescriptionItem[]

  @@index([patientId])
  @@index([doctorId])
}

model PrescriptionItem {
  id             String       @id @default(uuid())
  prescriptionId String
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicineId     String
  medicine       Medicine     @relation(fields: [medicineId], references: [id], onDelete: Restrict)
  dosage         String       // e.g. "1 tablet"
  frequency      String       // e.g. "Three times daily (TID)"
  duration       String       // e.g. "5 days"
  instructions   String?      // e.g. "Take after food"
  quantity       Int          @default(1)
  createdAt      DateTime     @default(now())

  @@index([prescriptionId])
  @@index([medicineId])
}

model Bill {
  id          String      @id @default(uuid())
  billNumber  String      @unique
  patientId   String
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Restrict)
  subTotal    Float
  taxAmount   Float       @default(0.0)
  discount    Float       @default(0.0)
  totalAmount Float
  status      BillStatus  @default(PENDING)
  notes       String?
  paidAt      DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  items       BillItem[]

  @@index([patientId])
  @@index([status])
}

model BillItem {
  id          String   @id @default(uuid())
  billId      String
  bill        Bill     @relation(fields: [billId], references: [id], onDelete: Cascade)
  description String
  quantity    Int      @default(1)
  unitPrice   Float
  totalPrice  Float
  createdAt   DateTime @default(now())

  @@index([billId])
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // e.g. "LOGIN", "CREATE_RECORD", "UPDATE_APPOINTMENT", "GENERATE_BILL"
  resource  String   // e.g. "MedicalRecord", "User", "Bill"
  details   String?  // JSON string or summary
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## 5. Incremental Implementation Phases

### Phase 1: Foundation & Prisma Setup
- Install required backend dependencies (`prisma`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `cors`, `zod`) and frontend packages (`react-router-dom`, `recharts`, `react-hook-form`).
- Create `prisma/schema.prisma` with all 14 entities and relations.
- Create `.env.example` documenting `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NODE_ENV`.
- Build the Express server scaffolding in `server/` with `/api/health` and database connectivity tester.
- Verify compilation and dev server initialization.

### Phase 2: Authentication & Authorization Middleware
- Implement password hashing with `bcryptjs`.
- Create JWT generator and verifier with expiry (24h).
- Build `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Implement `requireAuth` and `requireRole(Role.ADMIN, Role.DOCTOR, ...)` middlewares.
- Create frontend AuthContext with session persistence and 1-click Quick Login for all 4 demo roles.

### Phase 3: Role-Specific Dashboards
- **Admin Dashboard**: KPIs (total patients, active doctors, daily appointments, simulated revenue, occupancy rate), Recharts patient flow analytics, quick actions.
- **Doctor Dashboard**: Assigned today's appointments, pending consultations queue, recent patient records.
- **Receptionist Dashboard**: Real-time waiting room counter, appointment scheduler, quick patient intake form.
- **Patient Dashboard**: Upcoming consultations, active prescriptions, recent diagnoses, pending invoices.

### Phase 4: Patient Management Module
- CRUD operations for `/api/patients` with search by name/MRN, filtering by gender/blood group, and pagination.
- Detailed patient chart view: medical history, allergies, chronic conditions, emergency contacts, linked appointments, and records.

### Phase 5: Doctor & Department Management
- Endpoints for `/api/doctors` and `/api/departments`.
- Manage doctor schedules, consultation fees, specializations, and department directory.

### Phase 6: Appointment Scheduling & Conflict Detection
- Endpoints for `/api/appointments` with status updates (`Scheduled` → `In Progress` → `Completed` / `Cancelled`).
- Backend slot conflict validation (preventing overlapping appointments for the same doctor and slot).

### Phase 7: Medical Records & Clinical Notes
- Endpoints for `/api/medical-records` with strict authorization (only attending doctors and admins can write; patients can only view their own).
- Chief complaint, differential diagnosis, treatment plan, and lab observations.

### Phase 8: Digital Prescriptions & Pharmacy Inventory
- Endpoints for `/api/prescriptions` and `/api/medicines`.
- Dynamic multi-item prescription builder (dosage, frequency, duration, food timing) linked to pharmacy stock quantities.

### Phase 9: Hospital Room Management
- Endpoints for `/api/rooms` with room status toggling (`Available`, `Occupied`, `Maintenance`).
- Room allocation to inpatient visits.

### Phase 10: Simulated Invoicing & Billing
- Endpoints for `/api/bills` with line items for doctor consultation fees, room daily charges, and prescribed medicines.
- Simulated payment status update (`Pending` → `Paid`) with zero financial API calls.

### Phase 11: Reports & Audit Logging
- Endpoints for `/api/reports` and `/api/audit-logs`.
- Department utilization charts, revenue trends, appointment completion rates, and tamper-evident audit logs.

### Phase 12: Comprehensive Documentation & Local Setup Guide
- Complete `README.md` with Debian 13 local installation steps, Supabase configuration guide, Prisma migration steps, and demo credentials.
