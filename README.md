# College Exam Portal

A full-stack single-college online examination portal.

## Included

- Admin and student authentication
- Admin-created exam "spaces"
- Each space has its own student roster and can be modified after creation
- Question bank
- MCQ, multiple-choice, true/false, numerical, short-answer and descriptive questions
- Exam scheduling and configuration
- Configurable result release
- Server-authoritative attempt timer
- Auto-save answers
- Strict browser integrity monitoring
- Auto-submit when the student leaves the exam context
- Server-side evaluation for objective questions
- Manual evaluation support for subjective questions
- Results and integrity logs
- CSV student import
- Traditional college-style UI

## Stack

Frontend: Next.js + TypeScript + Tailwind CSS
Backend: Node.js + Express + TypeScript
Database: MongoDB + Mongoose
Auth: JWT + bcrypt
Validation: Zod

## Run

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

### Default admin

Create the first admin through:

```bash
cd backend
npm run seed:admin
```

The seed command reads ADMIN_EMAIL and ADMIN_PASSWORD from `.env`.

## Important production notes

Browser APIs cannot provide reliable OS-level visibility into every Alt+Tab/desktop switch. The implementation detects the observable consequences: document visibility changes, window focus loss, fullscreen exit, and page lifecycle events. The server records the violation and locks/submits the attempt.

For production deployment, use HTTPS, secure cookies or a robust token strategy, rate limiting, a managed MongoDB deployment, CSRF protection where applicable, audit logging, backups, and institution-approved privacy/consent policies.
