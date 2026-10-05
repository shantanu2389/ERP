# 🎓 CGC Landran — College ERP System

> **Architecture**: TypeScript REST API + Next.js Web Portal + Prisma ORM. Local development uses SQLite; production can use PostgreSQL.
> **Target Scale**: ~5,000+ Students with High Concurrency  
> **Security**: Role-Based Access Control (RBAC), Granular Permissions, Immutable Audit Logs, Zero Plaintext Passwords.

---

## 🏗️ System Architecture

```text
                  ┌────────────────────────────────────────┐
                  │          PostgreSQL DB (Prisma)        │
                  └───────────────────┬────────────────────┘
                                      │
                         ┌────────────▼───────────┐
                         │   Backend REST API     │
                         │   Express / NestJS     │
                         └────────────┬───────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │                                           │
         ┌──────▼────────┐                           ┌──────▼──────┐
         │  Web Portal   │                           │  Mobile App │
         │    Next.js    │                           │ React Native│
         └───────────────┘                           └─────────────┘
```

### Modular Boundaries:
- **Auth Module**: JWT issuing, Bearer auth, bcrypt password hashing, login audit events.
- **Student Module**: Demographics, attendance stats, bunk predictor, timetable, notes, assignments, report card.
- **Teacher Module**: Class rosters, attendance marking, study notes upload, assignment creation, submission grading.
- **Admin Module**: Sensitive profile correction approval workflow, user management, account suspend/activate, regulatory audit log inspection.
- **Audit Module**: Immutable event stream tracking `WHO`, `WHAT`, `OLD VALUE`, `NEW VALUE`, `WHEN`, and `IP ADDRESS`.

---

## 🔐 Dedicated Portal Authentication & Separate Role Access

Direct unrestricted landing access has been replaced with a **Dedicated Multi-Portal Login Section**:
- **Student Portal Tab**: Log in using Student Roll Number (e.g. `24CSE1023`) or college email.
- **Faculty / Teacher Portal Tab**: Log in using Employee ID (e.g. `FAC-CSE-101`) or institutional email.
- **Admin Portal Tab**: Log in using administrative email (`erpadmin1@college.edu`).
- **One-Click Fast Demo Logins**: Dedicated 1-click test credential chips for instant evaluation.
- **Log Out Action**: Clear sign-out button returning users to the portal selector.

## 🔑 Default Seed Test Accounts

| Portal Role | Name | Identifier (Roll / Faculty ID / Email) | Password | Operations Available |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Patel | `24CSE1023` or `24cse1023@college.edu` | `StudentPassword@123` | Attendance & Bunk Predictor, Timetable, Notes, Assignment Submissions, Locked Profile Corrections |
| **Teacher** | Prof. Rajesh Sharma | `FAC-CSE-101` or `prof.sharma@college.edu` | `TeacherPassword@123` | Mark/Edit Attendance Register, Upload Notes & PDFs, Create Assignments, Grade Submissions |
| **ERP Admin #102** | Suresh Mehta | `erpadmin1@college.edu` | `AdminPassword@123` | Review & Approve Profile Corrections (Father's Name change), Audit Trail Inspection |
| **Super Admin** | Dr. Arvind Swaminathan | `superadmin@college.edu` | `AdminPassword@123` | College Director, Master System Privileges, Student Directory Management |

---

## 🚀 Running the System Locally

### 1. Backend REST API
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts     # Populates rich dummy data
npm run start:dev          # Starts API at http://localhost:5000
```
- Health Check: `http://localhost:5000/api/health`

### 2. Frontend Next.js Web Portal
```bash
cd frontend
npm install
npm run dev                # Starts Web Portal at http://localhost:3000
```

Keep the backend and frontend running in separate terminals. If port 3000 or 5000 is already occupied, stop the old process before restarting.

---

## 🌟 Key Implemented Features

### 1. Attendance & Bunk Predictor Engine
Calculates both overall attendance and subject-wise percentages with dynamic advisory logic:
- **If $\ge 75\%$**: Calculates how many upcoming lectures you can safely miss without dropping below 75%:
  $$\text{Safe Bunks} = \left\lfloor \frac{\text{Attended} - 0.75 \times \text{Total}}{0.75} \right\rfloor$$
- **If $< 75\%$**: Calculates how many consecutive classes you must attend to recover back to 75%:
  $$\text{Required Presents} = \left\lceil \frac{0.75 \times \text{Total} - \text{Attended}}{1 - 0.75} \right\rceil$$

### 2. Sensitive Information Correction Workflow
- Critical attributes (Father's Name, Mother's Name, Date of Birth, Admission Number) are locked for students.
- Students can submit a **Profile Correction Request** (e.g. fixing Father's Name from `Rajesh Kumar` to `Rakesh Kumar`).
- The **ERP Admin** reviews the request, verifies certificates, and clicks **Approve**.
- The database is updated automatically, and an immutable **Audit Log** is generated.

### 3. Regulatory Audit Logs
Every privileged change records:
- **WHO**: User name & Role (e.g., `Suresh Mehta (Admin #102)`)
- **WHAT**: Action type (`PROFILE_CORRECTION_APPROVED`, `ATTENDANCE_MARKED`, etc.)
- **OLD VALUE**: Previous field state
- **NEW VALUE**: Updated field state
- **WHEN**: Exact ISO timestamp
- **IP**: Client IP address

---

## 🐳 Production Deployment (PostgreSQL + Redis + S3)
To deploy with Docker:
```bash
docker compose up -d
```
Then update `backend/.env`:
```env
DATABASE_URL="postgresql://erp_user:${POSTGRES_PASSWORD}@localhost:5432/college_erp"
```
The repository now uses `backend/prisma/schema.prisma` as the single source of truth. Start PostgreSQL with Docker, then push the schema using `npm run prisma:push` from `backend`.
