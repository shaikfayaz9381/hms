# MedPulse — Hospital Management System

> **Academic College Demonstration Project**  
> *Developed for local execution on Debian 13 Linux with Supabase PostgreSQL as the primary database.*  
> *Development Cost: ₹0 / $0 (Utilizes free tier services, local Node.js/Express, and zero paid API subscriptions).*

---

## 1. Project Overview

**MedPulse** is a comprehensive, production-grade Hospital Management System designed to digitize healthcare administration and clinical records across four primary roles:
1. **Hospital Administrator**: System-wide control, staff credentials, departmental allocations, pharmacy management, room occupancy, financial ledgers, and tamper-evident audit logs.
2. **Attending Doctor**: Today's appointment schedule, assigned patient queues, clinical diagnoses, and digital prescription writing with automatic pharmacy stock checks.
3. **Receptionist / Front Desk**: Patient registration, appointment booking with time-slot conflict detection, physician directories, room occupancy status, and billing invoice creation.
4. **Patient**: Personal health portal, appointment history, medical diagnoses, active medication prescriptions, and simulated billing statements.

---

## 2. Technology Stack

### Frontend
- **React 19** & **TypeScript**
- **Vite 8**
- **Tailwind CSS v4** (Clinical Teal and Slate visual design)
- **Lucide React** (Medical & UI icons)
- **Recharts** (Department consultation volume & patient activity trends)

### Backend
- **Node.js 22 LTS** & **TypeScript**
- **Express 4.21** REST API
- **JWT (JSON Web Tokens)** for session management
- **bcryptjs** (10 salt rounds) for cryptographic password hashing
- **Zod** for schema and payload validation
- **CORS** configured for local origins

### Database & Persistence
- **Supabase PostgreSQL** (Primary hosted relational database)
- **Prisma ORM (v6)** for type-safe queries, relational joins, and migrations
- **Prisma Migrate** for relational schema lifecycle

---

## 3. Architecture & Deployment Boundary

```text
               LOCAL MACHINE (Debian 13 Linux)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Web Browser (localhost)                                  │
│         │                                                   │
│         │ React SPA (Vite Dev Server / Static Assets)       │
│         ▼                                                   │
│   Frontend Client (Port 3000 unified or 5173 standalone)   │
│         │                                                   │
│         │ HTTP REST API (JSON)                              │
│         │ Authorization: Bearer <JWT>                       │
│         ▼                                                   │
│   Node.js + Express Server (Port 3000 / Port 5000)          │
│   - JWT Auth & Role Authorization Middleware                │
│   - Zod Input Validators & Conflict Detection               │
│   - Audit Logging Engine                                    │
│         │                                                   │
│         │ Prisma Client ORM                                 │
│                                                             │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ PostgreSQL Protocol (Port 6543 Pooled / 5432 Direct)
          │ Encrypted TLS / SSL Mode: require
          ▼
   HOSTED CLOUD DATABASE
┌─────────────────────────────────────────────────────────────┐
│   Supabase Hosted PostgreSQL                                │
│   - 14 Relational Models (User, Patient, Doctor, etc.)      │
│   - Foreign Key Constraints & Cascading Policies            │
│   - Indexes on MRN, Email, License, and Timestamps          │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Hosted Database vs. Local Execution Model:**
> - The frontend and backend **run strictly locally** on your Debian 13 computer.
> - The database is **hosted on Supabase** (free tier). Therefore, an active internet connection is required during runtime to communicate with Supabase PostgreSQL.
> - The browser never communicates directly with Supabase or PostgreSQL; all database interactions are proxied through the Express backend. Privileged database credentials are never bundled into client code.

---

## 4. Supabase Setup Guide (₹0 Cost)

Follow these steps to create and configure your free Supabase database:

1. **Create Free Account**:
   - Go to [supabase.com](https://supabase.com) and sign in.
   - Click **New Project** and name it (e.g., `medpulse-hospital`).
   - Choose a secure database password (save this safely).
   - Select the region closest to you and ensure the Free Plan is selected ($0/month).

2. **Obtain Connection Strings**:
   - Navigate to **Project Settings** &gt; **Database** &gt; **Connection string**.
   - Under the **URI** tab:
     - **Pooled (Transaction Mode, Port 6543)**: Copy this for `DATABASE_URL`.
     - **Direct (Session Mode, Port 5432)**: Copy this for `DIRECT_URL` (used by Prisma Migrate).

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Replace the placeholders with your actual Supabase credentials:
     ```env
     DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
     DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
     JWT_SECRET="medpulse-super-secret-jwt-key-min-32-chars"
     PORT=3000
     NODE_ENV=development
     ```

4. **Push Database Schema**:
   - Apply the 14 relational tables to Supabase:
     ```bash
     npm run db:push
     ```

5. **Seed Demonstration Data**:
   - Populate the database with doctors, patients, departments, medicines, and demo accounts:
     ```bash
     npm run db:seed
     ```

---

## 5. Demonstration Accounts

The database comes pre-seeded with 4 development-only role accounts. All accounts share the development password:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hospital.local` | `Password123!` | Complete access to all 10 modules and audit logs |
| **Doctor** | `doctor@hospital.local` | `Password123!` | Assigned consultations, patient charts, prescriptions |
| **Receptionist** | `reception@hospital.local` | `Password123!` | Patient intake, appointment booking, invoices |
| **Patient** | `patient@hospital.local` | `Password123!` | Personal medical records, prescriptions, billing |

*(Note: You can also switch between any of these accounts in 1 click using the role selector in the top bar).*

---

## 6. Local Development Startup Commands

### Unified Mode (Recommended - Single Command)
Runs Express and mounts Vite dev middleware together on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Standalone Dual-Process Mode
If you prefer running the backend and frontend in separate Debian terminal tabs:
```bash
# Terminal 1: Backend Express API on port 5000
npm run dev:server

# Terminal 2: Frontend Vite on port 5173
npm run dev:client
```

---

## 7. Database Schema Overview (14 Relational Models)

Defined in `prisma/schema.prisma`:

1. **User**: Credentials, hashed passwords (`bcryptjs`), system roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`).
2. **Department**: Hospital wings, clinical specializations, room counts.
3. **Doctor**: Specialization, medical license number, consultation fee, experience years, bio.
4. **Patient**: Medical Record Number (`MRN`), contact details, blood group, allergies, chronic conditions.
5. **Staff**: Administrative and operational support records.
6. **Room**: Hospital ward allocation, daily rate, status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`).
7. **Appointment**: Scheduled consultations, slot conflict prevention, triage vitals.
8. **MedicalRecord**: Formal diagnoses, chief complaints, treatment plans, lab observations.
9. **Medicine**: Pharmacy inventory, generic names, unit prices, reorder thresholds.
10. **Prescription**: Issued doctor prescriptions, general advice, patient references.
11. **PrescriptionItem**: Prescribed drug, dosage, frequency, duration, quantity.
12. **Bill**: Simulated hospital billing statements, tax rates, total balance.
13. **BillItem**: Itemized breakdown for consultations, ward beds, or medicines.
14. **AuditLog**: Security log of logins, diagnoses, and administrative updates.

---

## 8. REST API Endpoints Overview

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token |
| `POST` | `/api/auth/logout` | Authenticated | Clears user session |
| `GET` | `/api/auth/me` | Authenticated | Returns current profile with linked doctor/patient ID |
| `GET` | `/api/patients` | Admin, Doctor, Receptionist | Lists patients with search and blood group filter |
| `POST` | `/api/patients` | Admin, Receptionist | Registers new patient with auto-generated MRN |
| `GET` | `/api/patients/:id` | Authenticated | Fetches full clinical chart (patients restricted to own) |
| `GET` | `/api/doctors` | Authenticated | Lists physicians and department affiliations |
| `GET` | `/api/appointments` | Authenticated | Lists appointments with date and status filters |
| `POST` | `/api/appointments` | Authenticated | Schedules appointment with slot conflict validation |
| `PUT` | `/api/appointments/:id/status` | Authenticated | Updates consultation status (`CONFIRMED`, `COMPLETED`, etc.) |
| `GET` | `/api/medical-records` | Authenticated | Fetches clinical records (patients restricted to own) |
| `POST` | `/api/medical-records` | Doctor, Admin | Records clinical diagnosis and treatment plan |
| `GET` | `/api/prescriptions` | Authenticated | Lists digital prescriptions |
| `POST` | `/api/prescriptions` | Doctor, Admin | Issues prescription and deducts pharmacy inventory |
| `GET` | `/api/prescriptions/medicines` | Authenticated | Pharmacy inventory and stock levels |
| `PUT` | `/api/prescriptions/medicines/:id/stock` | Admin, Receptionist | Restocks pharmacy drug inventory |
| `GET` | `/api/rooms` | Authenticated | Hospital rooms and bed occupancy status |
| `PUT` | `/api/rooms/:id/status` | Admin, Receptionist | Updates room availability |
| `GET` | `/api/bills` | Authenticated | Invoices list (patients restricted to own) |
| `POST` | `/api/bills` | Admin, Receptionist | Generates simulated itemized invoice |
| `PUT` | `/api/bills/:id/pay` | Authenticated | Marks invoice as `PAID` (Simulated only) |
| `GET` | `/api/reports/dashboard` | Authenticated | KPI metrics, Recharts trends, department loads |
| `GET` | `/api/reports/audit-logs` | Admin | Tamper-evident system audit trail |
| `GET` | `/api/reports/database-status` | Public | Live Supabase latency and connection state |

---

## 9. Simulated Billing Mechanics

As specified in project requirements:
- Billing is **strictly simulated** for academic purposes.
- No payment gateway APIs (Stripe, Razorpay, PayPal, UPI) are integrated.
- Clicking "Simulate Pay" updates the record status in the database to `PAID` with a recorded timestamp (`paidAt`). No real monetary exchange or bank transaction occurs.

---

## 10. Local Offline Fallback (Using Local PostgreSQL)

If you need to develop or demonstrate without internet access:
1. Install PostgreSQL on Debian 13:
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib
   sudo -u postgres createdb hospital_db
   ```
2. Update `.env` to point to localhost:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_db"
   ```
3. Run `npm run db:push && npm run db:seed`.
4. The exact same Prisma schema, models, and Express controllers continue to function without modifying application code.

---

## 11. Security & Compliance Disclaimer

> **Academic Demonstration Notice:**  
> This software is created solely for college academic evaluation and software engineering demonstration. It is **not** HIPAA or GDPR certified, nor is it intended for real clinical patient diagnosis or emergency life-critical operations.
