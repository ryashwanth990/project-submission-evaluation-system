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

The **Project Submission & Evaluation System** is a full-stack web application designed to manage student project submissions and their evaluation process. It provides a structured way for students to submit academic projects and for faculty to evaluate them with detailed scoring across multiple criteria.

### Features

- **Student Portal** — Register, login, submit projects with metadata (title, description, domain, GitHub URL, team members, semester)
- **Faculty Portal** — Review assigned projects, submit evaluations with scores across Innovation, Technical, Presentation, and Documentation dimensions
- **Dashboard** — Role-aware statistics: total projects, pending reviews, average scores, domain breakdowns
- **Project Management** — Full CRUD for projects, evaluator assignment, status tracking (Submitted → Under Review → Evaluated)
- **Activity Feed** — Real-time activity log of recent submissions, assignments, and evaluations

---

## Live Website

🔗 **[https://project-submission-evaluation-system.replit.app](https://project-submission-evaluation-system.replit.app)**

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@sahyadri.edu.in | admin123 |
| Faculty | shashidhar@sahyadri.edu.in | faculty123 |
| Faculty | priya@sahyadri.edu.in | faculty456 |
| Student | hithesh@student.sahyadri.edu.in | student123 |
| Student | pavan@student.sahyadri.edu.in | student456 |

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

## Database Schema

### Tables

**users**
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `role` TEXT NOT NULL — `student` or `faculty`
- `usn` TEXT — Student University Serial Number (students only)
- `department` TEXT
- `created_at` TIMESTAMPTZ

**projects**
- `id` SERIAL PRIMARY KEY
- `title` TEXT NOT NULL
- `description` TEXT NOT NULL
- `domain` TEXT NOT NULL — AI/ML, Web Dev, App Dev, IoT, Data Science, Cybersecurity, Other
- `status` TEXT NOT NULL — `submitted`, `under_review`, `evaluated`, `approved`, `rejected`
- `student_id` INTEGER → users(id)
- `evaluator_id` INTEGER → users(id) (nullable)
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
│           ├── components/  # UI components (shadcn/ui)
│           ├── lib/         # auth context, API setup
│           └── pages/       # login, register, dashboard, projects, evaluations
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

Register as a student or faculty member to get started.

---

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/logout` | Logout | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/projects` | List projects | Yes |
| POST | `/api/projects` | Submit project | Student |
| GET | `/api/projects/:id` | Get project detail | Yes |
| PATCH | `/api/projects/:id` | Update project | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |
| POST | `/api/projects/:id/assign` | Assign evaluator | Faculty |
| GET | `/api/evaluations` | List evaluations | Yes |
| POST | `/api/evaluations` | Submit evaluation | Faculty |
| GET | `/api/evaluations/:id` | Get evaluation | Yes |
| PATCH | `/api/evaluations/:id` | Update evaluation | Faculty |
| GET | `/api/dashboard/stats` | Dashboard stats | Yes |
| GET | `/api/dashboard/recent-activity` | Recent activity | Yes |
| GET | `/api/faculty` | List faculty | Yes |
| GET | `/api/students` | List students | Yes |

---

## References

1. Fundamentals of Database Systems — Ramez Elmasri and Shamkant B. Navathe, 7th Edition, 2017, Pearson.
2. Database Management Systems — Ramakrishnan, and Gehrke, 3rd Edition, 2014, McGraw Hill.
3. Silberschatz Korth and Sudharshan: Database System Concepts. 6th Edition, Mc-Graw Hill, 2013.
4. Coronel, Morris, and Rob: Database Principles Fundamentals of Design, Implementation and Management. Cengage Learning 2012.
