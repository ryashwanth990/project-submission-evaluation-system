# Project Submission & Evaluation System

**BAI402G – Database Management Systems Mini Project**  
Department of Computer Science and Engineering (AI & Machine Learning)  
Sahyadri College of Engineering & Management, Mangaluru  
Academic Year: 2025-26 (IV Semester)

| Student Name | USN |
|---|---|
| Hithesh Kundar | 4SF24CI061 |
| Pavan D P | 4SF24CI116 |

**Faculty In-charge:** Mr. Shashidhar

---

## Project Description

The **Project Submission & Evaluation System** is a full-stack web application designed to manage student project submissions and their evaluation process. It provides a structured workflow where students submit academic projects, admins assign faculty evaluators, and faculty submit detailed scored evaluations.

### Features

- **Admin Portal** — Assign faculty evaluators to submitted projects, reassign evaluators, and view all projects with assignment status at a glance
- **Student Portal** — Register, login, submit projects with metadata (title, description, domain, GitHub URL, team members, semester)
- **Faculty Portal** — Review assigned projects, submit evaluations with scores across Innovation, Technical, Presentation, and Documentation dimensions; export evaluation reports as CSV or PDF
- **Dashboard** — Role-aware statistics: total projects, pending reviews, average scores, domain breakdowns
- **Project Management** — Full CRUD for projects, status tracking (Submitted → Under Review → Evaluated → Approved/Rejected)
- **Activity Feed** — Real-time activity log of recent submissions, assignments, and evaluations

---

## Live Website

🔗 **[https://project-submission-evaluation-system.replit.app](https://project-submission-evaluation-system.replit.app)**

### Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@sahyadri.edu.in | admin123 | Assign evaluators to projects |
| Faculty | shashidhar@sahyadri.edu.in | faculty123 | Evaluate projects, export reports |
| Faculty | priya@sahyadri.edu.in | faculty456 | Evaluate projects, export reports |
| Student | hithesh@student.sahyadri.edu.in | student123 | Submit and track projects |
| Student | pavan@student.sahyadri.edu.in | student456 | Submit and track projects |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL (Replit managed) |
| ORM | Drizzle ORM |
| Validation | Zod |
| API Client | Orval (OpenAPI codegen → React Query hooks) |
| Auth | JWT (jsonwebtoken) + PBKDF2 password hashing |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |

---

## User Roles

| Role | Description |
|---|---|
| `admin` | System administrator. Can assign and reassign faculty evaluators to any project. Has access to Admin Portal and all Projects. |
| `faculty` | Evaluator. Can view assigned projects, submit evaluations with detailed scoring, update project status, and export evaluation reports. |
| `student` | Can register, submit projects, and track their submission status and evaluation results. |

---

## Database Schema

### Tables

**users**
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `role` TEXT NOT NULL — `student`, `faculty`, or `admin`
- `usn` TEXT — University Serial Number (students only)
- `department` TEXT
- `created_at` TIMESTAMPTZ

**projects**
- `id` SERIAL PRIMARY KEY
- `title` TEXT NOT NULL
- `description` TEXT NOT NULL
- `domain` TEXT NOT NULL — AI/ML, Web Dev, App Dev, IoT, Data Science, Cybersecurity, Other
- `status` TEXT NOT NULL — `submitted`, `under_review`, `evaluated`, `approved`, `rejected`
- `student_id` INTEGER → users(id)
- `evaluator_id` INTEGER → users(id) (nullable — assigned by admin)
- `github_url` TEXT
- `report_url` TEXT
- `team_members` TEXT
- `semester` TEXT
- `academic_year` TEXT
- `average_score` REAL
- `created_at` / `updated_at` TIMESTAMPTZ

**evaluations**
- `id` SERIAL PRIMARY KEY
- `project_id` INTEGER → projects(id)
- `faculty_id` INTEGER → users(id)
- `score` REAL NOT NULL (0–100)
- `feedback` TEXT NOT NULL
- `innovation_score` REAL
- `technical_score` REAL
- `presentation_score` REAL
- `documentation_score` REAL
- `created_at` TIMESTAMPTZ

**activity**
- `id` SERIAL PRIMARY KEY
- `type` TEXT NOT NULL
- `message` TEXT NOT NULL
- `project_id` INTEGER (nullable)
- `user_id` INTEGER (nullable)
- `created_at` TIMESTAMPTZ

---

## Project Structure

```
project-submission-evaluation-system/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── lib/         # auth utilities, logger
│   │       ├── middlewares/ # JWT auth middleware
│   │       └── routes/      # auth, projects, evaluations, dashboard, users
│   └── project-eval/        # React + Vite frontend
│       └── src/
│           ├── components/  # UI components (shadcn/ui, layout)
│           ├── lib/         # auth context, API setup
│           └── pages/       # login, register, admin, dashboard, projects, evaluations
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + client
└── pnpm-workspace.yaml
```

---

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (local or cloud — see below)

### 1. Clone the repository

```bash
git clone https://github.com/ryashwanth990/project-submission-evaluation-system.git
cd project-submission-evaluation-system
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file or export these variables:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/project_eval

# Optional (JWT signing secret — use a long random string in production)
SESSION_SECRET=your-super-secret-key-here
```

**Free PostgreSQL options:**
- [Neon](https://neon.tech) — free serverless Postgres, get `DATABASE_URL` from the dashboard
- [Supabase](https://supabase.com) — free tier, use the connection string from Project Settings
- [Railway](https://railway.app) — free tier PostgreSQL

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Start the API server (in one terminal)

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

### 6. Start the frontend (in another terminal)

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/project-eval run dev
```

### 7. Open the app

Visit **http://localhost:3000** in your browser.

---

## API Endpoints

### Authentication

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user (student or faculty) | No |
| POST | `/api/auth/login` | Login and receive a JWT token | No |
| POST | `/api/auth/logout` | Logout (clears session) | No |
| GET | `/api/auth/me` | Get the currently authenticated user | Yes |

### Projects

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/projects` | List all projects (filtered by role) | Yes |
| POST | `/api/projects` | Submit a new project | Student only |
| GET | `/api/projects/:id` | Get full project details with evaluations | Yes |
| PATCH | `/api/projects/:id` | Update project details or status | Yes |
| DELETE | `/api/projects/:id` | Delete a project | Yes |
| POST | `/api/projects/:id/assign` | Assign a faculty evaluator to a project | **Admin only** |

### Evaluations

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/evaluations` | List evaluations (faculty sees own; admin sees all) | Yes |
| POST | `/api/evaluations` | Submit a new evaluation for a project | Faculty only |
| GET | `/api/evaluations/:id` | Get a specific evaluation | Yes |
| PATCH | `/api/evaluations/:id` | Update an existing evaluation | Faculty only |
| GET | `/api/evaluations/export` | Export evaluations as CSV file | Yes |

### Dashboard & Users

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/dashboard/stats` | Get role-aware dashboard statistics | Yes |
| GET | `/api/dashboard/recent-activity` | Get recent system activity feed | Yes |
| GET | `/api/faculty` | List all faculty members | Yes |
| GET | `/api/students` | List all students | Yes |

---

## References

1. Fundamentals of Database Systems — Ramez Elmasri and Shamkant B. Navathe, 7th Edition, 2017, Pearson.
2. Database Management Systems — Ramakrishnan, and Gehrke, 3rd Edition, 2014, McGraw Hill.
3. Silberschatz Korth and Sudharshan: Database System Concepts. 6th Edition, Mc-Graw Hill, 2013.
4. Coronel, Morris, and Rob: Database Principles Fundamentals of Design, Implementation and Management. Cengage Learning 2012.
