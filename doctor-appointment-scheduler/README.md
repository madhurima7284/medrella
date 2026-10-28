# Medrella Doctor Appointment Scheduler

A production-minded, full-stack healthcare appointment scheduling platform connecting patients and verified specialists. Inspired by the workflows and usability of Medrella, Zocdoc, and modern healthcare booking systems.

---

## 1. Architecture Overview

This project is organized as a clean, decoupled monorepo:

```text
doctor-appointment-scheduler/
├── frontend/               # Next.js 14+ (App Router, JavaScript, Tailwind CSS)
│   ├── app/                # Public, Patient, Doctor, and Admin routes
│   ├── components/         # Reusable UI components & status badges
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API client, Auth state, and Zod schemas
│   └── package.json
├── backend/                # NestJS REST API (Node.js, TypeScript, Swagger)
│   ├── src/
│   │   ├── auth/           # JWT authentication, guards, and RBAC
│   │   ├── users/          # User management
│   │   ├── doctors/        # Doctor profiles, search, and directory
│   │   ├── specialties/    # Medical specialties management
│   │   ├── availability/   # Working hours & dynamic slot generator
│   │   ├── appointments/   # Concurrency-safe booking & lifecycle
│   │   ├── admin/          # Platform administration & approvals
│   │   ├── prisma/         # Prisma ORM database service
│   │   └── common/         # Exception filters & transform interceptors
│   ├── prisma/             # Schema definition & development seed script
│   ├── test/               # Automated E2E and unit test suites
│   └── package.json
├── docker-compose.yml      # Local multi-container PostgreSQL and services
└── README.md
```

---

## 2. Technology Stack

- **Frontend**: Next.js App Router (JavaScript), React, Tailwind CSS, Lucide Icons, React Hook Form + Zod.
- **Backend**: NestJS, Node.js, TypeScript, Passport JWT, Class-Validator, Swagger/OpenAPI.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: JWT access & refresh tokens, bcrypt password hashing, Role-Based Access Control (`PATIENT`, `DOCTOR`, `ADMIN`).
- **Concurrency & Booking**: Atomic slot overlap validation, strict transaction boundaries preventing double-booking.

---

## 3. Database Schema (Prisma)

The schema defines normalized relational entities:
- **User**: Core authentication identity (email, password hash, role, phone, active status).
- **PatientProfile**: Medical demographics, address, emergency contact.
- **DoctorProfile**: Specialty reference, qualifications, experience, consultation fee, bio, clinic details, approval status (`PENDING`, `APPROVED`, `REJECTED`).
- **Specialty**: Medical categories (Cardiology, Dermatology, etc.) with description and icon.
- **Availability**: Weekly recurring schedule per doctor (day of week, start time, end time, slot duration in minutes).
- **Appointment**: Patient, doctor, start timestamp, end timestamp, visit reason, status (`PENDING`, `CONFIRMED`, `CANCELLED`, `REJECTED`, `COMPLETED`), cancellation reason.
- **RefreshToken**: Hashed tokens with expiration and revocation tracking.

---

## 4. Getting Started Locally

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Docker or a running PostgreSQL database instance

### Step 1: Clone and Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/doctor-appointment-scheduler.git
cd doctor-appointment-scheduler

# Configure backend environment
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medrella_db?schema=public"
# JWT_ACCESS_SECRET="your-super-secret-jwt-key"
# FRONTEND_URL="http://localhost:3000"

# Configure frontend environment
cd ../frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### Step 2: Database Migration & Seeding

```bash
cd ../backend
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed development specialists, schedules, demo accounts, and appointments
npx prisma db seed
```

### Step 3: Start the Backend (NestJS)

```bash
# In the backend directory
npm run start:dev
# REST API will start on http://localhost:4000
# Swagger API documentation will be available at http://localhost:4000/api/docs
```

### Step 4: Start the Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev
# Next.js will be running at http://localhost:3000
```

---

## 5. Seed Accounts for Development Testing

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@medrella.com` | `Admin@123` | Full admin privileges, approval workflows |
| **Doctor (Approved)** | `dr.jenkins@medrella.com` | `Doctor@123` | Cardiologist, 14 yrs exp, clinic: Beacon Heart |
| **Doctor (Approved)** | `dr.vance@medrella.com` | `Doctor@123` | Dermatologist, 11 yrs exp, clinic: ClearSkin |
| **Doctor (Pending)** | `dr.patel@medrella.com` | `Doctor@123` | Pediatrician awaiting admin approval |
| **Patient** | `john.doe@example.com` | `Patient@123` | Existing patient with test appointments |

---

## 6. End-to-End Testing Verification Checklist

1. **Patient Booking Workflow**:
   - Log in as `john.doe@example.com`.
   - Browse the Doctor Directory or filter by Cardiology.
   - Open Dr. Sarah Jenkins' profile.
   - Pick a date and an available slot.
   - Enter consultation reason and confirm booking.
   - Check that the new appointment appears in **My Appointments** as `CONFIRMED`.
   - Log out.

2. **Doctor Schedule & Workflow**:
   - Log in as `dr.jenkins@medrella.com`.
   - View Doctor Dashboard: see the new appointment booked by Johnathan Doe.
   - Review patient medical reason.
   - Update appointment status to `COMPLETED` or manage availability hours.

3. **Admin Verification & Approval**:
   - Log in as `admin@medrella.com`.
   - Check platform KPIs (total patients, doctors, appointments, revenue).
   - Go to Doctor Management and locate `Dr. Liam Patel` (`PENDING`).
   - Click **Approve**.
   - Confirm Dr. Patel is now visible in the public directory and eligible for bookings.

4. **Concurrency & Double-Booking Prevention**:
   - Attempt to book the same slot simultaneously from two sessions.
   - The second request receives HTTP 409 Conflict with an explanation that the slot was reserved.

---

## 7. Production Deployment Instructions

### Deploy Frontend (Vercel)
1. Push repository to GitHub.
2. Link the repository on [Vercel](https://vercel.com).
3. Set the root directory to `frontend`.
4. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed NestJS backend URL (e.g. `https://medrella-api.onrender.com/api`).
5. Deploy.

### Deploy Backend (Render / Railway)
1. Link the repository on [Render](https://render.com).
2. Create a Web Service pointing to the `backend` directory.
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `npx prisma migrate deploy && npm run start:prod`
5. Set Environment Variables:
   - `DATABASE_URL`: Hosted PostgreSQL connection URI (e.g., Supabase, Neon, or Render PostgreSQL).
   - `JWT_ACCESS_SECRET`: 64-character random string.
   - `FRONTEND_URL`: URL of your deployed Next.js frontend.
   - `PORT`: `4000` (or injected by Render).
