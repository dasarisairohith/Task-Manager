# 🚀 Collaborative Task Management System

A full-stack task management application built with **Next.js 14 + TypeScript**, **Flask + Python**, **Supabase PostgreSQL/Auth**, **Google OAuth 2.0**, and **Gmail SMTP notifications**.

## Architecture

```
Next.js Frontend
      │
      │ Supabase access token
      ▼
Flask REST API ───────► Supabase PostgreSQL
      │
      └───────────────► Gmail SMTP
```

The browser authenticates with Supabase. Every protected Flask endpoint validates the Supabase access token and uses the authenticated user ID from the token rather than trusting user IDs supplied by the browser.

### Vercel deployment:

https://vercel.com/d-s-rohith/task-manager

## Application flow

1. Opening the application sends the user to the sign-in page.
2. The user continues with Google. Supabase creates their account on their first sign-in and authenticates existing accounts on later sign-ins.
3. After authentication, the user is taken to the TaskFlow dashboard.
4. The dashboard loads the user's profile, tasks and analytics from the Flask API, which reads and writes application data in Supabase.
5. Users can create tasks and assign them to registered Task Manager users. Gmail notifications are sent for task creation and when a task first changes to **Completed**.

## Features

- Google OAuth sign-in through Supabase; a user's Task Manager account is created on their first Google sign-in
- Sign-in-first application flow: opening the app routes to sign-in, then successful Google authentication opens the dashboard
- Secure authenticated Flask API
- Create, assign to registered users, edit, complete, reopen and delete tasks
- Store and fetch tasks and user profiles through the Flask API and Supabase PostgreSQL
- Task priorities and due dates
- Search across task title and description
- Task filtering and dashboard tabs
- Task discussion/comments
- Gmail notification when a task is created (sent to the creator and, if assigned, the assignee)
- Gmail notification when a task is marked completed (sent to the creator and assignee)
- Total, pending, in-progress, completed and overdue analytics
- Overdue task indicators
- Supabase Row Level Security
- Responsive Next.js UI
- Vercel frontend + Render/Railway backend deployment support

## Security model

- Flask validates every protected API request with the Supabase access token.
- The backend derives the current user from the token.
- Users can only read tasks they created or are assigned to.
- Creators and assignees can update tasks.
- Only task creators can delete tasks.
- Comments are restricted to users participating in the task.
- CORS is restricted to the configured frontend origin(s).
- The Supabase **service-role key is backend-only**.
- Demo login is disabled for production.

## Repository structure

```
task-manager/
├── migrations/
│   └── 01_initial_schema.sql
├── backend/
│   ├── app.py
│   ├── auth_utils.py
│   ├── config.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml
│   ├── Procfile
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py
│   │   ├── tasks.py
│   │   ├── users.py
│   │   ├── comments.py
│   │   └── analytics.py
│   └── services/
│       ├── supabase_service.py
│       └── email_service.py
└── frontend/
    ├── package.json
    ├── vercel.json
    ├── .env.example
    └── src/
        ├── app/
        │   ├── login/page.tsx
        │   └── dashboard/page.tsx
        ├── components/
        └── lib/
            ├── api.ts
            └── supabaseClient.ts
```

# 🛠️ Local setup

## 1. Supabase database

Open your Supabase project **SQL Editor** and run:

`migrations/01_initial_schema.sql`

If you previously ran an older version of the migration, run the updated file again. It drops and recreates the affected RLS policies.

The migration creates:

- `profiles`
- `tasks`
- `task_comments`
- profile synchronization trigger
- task `updated_at` trigger
- secure RLS policies
- task/comment indexes

## 2. Configure Google OAuth

In Supabase:

1. Open **Authentication → Providers → Google**.
2. Enable Google.
3. Create/configure the Google OAuth client in Google Cloud.
4. Add the Supabase OAuth callback URL shown by your Supabase project to the Google OAuth client's authorized redirect URIs.
5. Add your local and production application URLs where Supabase requires redirect URLs.

The application uses:

`supabase.auth.signInWithOAuth({ provider: 'google' })`

## 3. Backend

```bash
cd backend
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and set:

```env
PORT=5000
FLASK_DEBUG=False
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

**Important:** `SUPABASE_KEY` is server-side only. Never put the service-role key in the frontend or commit it to GitHub.

Run:

```bash
python app.py
```

Backend:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

## 4. Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUXX_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
```

Run:

```bash
npm run dev
```

Frontend:

`http://localhost:3000`

# 📧 Gmail notifications

For Gmail SMTP:

1. Enable Google 2-Step Verification.
2. Create a Google App Password.
3. Set `GMAIL_USER`.
4. Set `GMAIL_APP_PASSWORD`.
5. Set `SMTP_SERVER=smtp.gmail.com` and `SMTP_PORT=587`.
6. Create a task and check the creator's inbox and the assignee's inbox (when assigned).
7. Mark a task completed and check the creator's and assignee's inboxes.

Do not use your normal Gmail password.

Email delivery was confirmed during local testing. Test task-created and task-completed notifications separately in the environment you deploy, since receiving one email does not by itself verify both event paths. Notifications are dispatched in a background thread by the Flask backend.

# 🚀 Production deployment

## Supabase

Before deployment:

- Run the latest `migrations/01_initial_schema.sql`.
- Enable Google authentication.
- Configure production redirect URLs.
- Verify RLS policies.
- Confirm your production users are created through Supabase Auth.

## Flask on Render/Railway

Set:

```env
PORT=5000
FLASK_DEBUG=False
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_KEY=YOUR-SUPABASE-SERVICE-ROLE-KEY
GMAIL_USER=YOUR-GMAIL-ADDRESS
GMAIL_APP_PASSWORD=YOUR-GMAIL-APP-PASSWORD
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

Use the existing Gunicorn/Render configuration in the repository.

## Next.js on Vercel

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-KEY
NEXT_PUXX_API_BASE_URL=https://YOUR-BACKEND-DOMAIN/api
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
```

Never add `SUPABASE_SERVICE_ROLE_KEY` or Gmail credentials to Vercel frontend environment variables.

# ✅ Pre-deployment smoke test

Test this sequence with two real Google accounts:

1. User A signs in with Google.
2. User B signs in with Google.
3. User A creates a task assigned to User B.
4. User B receives the assignment email.
5. User B sees the task in **Assigned to Me**.
6. User B adds a discussion comment.
7. User B changes the task to **In Progress**.
8. User B marks the task **Completed**.
9. Creator and assignee receive completion notifications.
10. The dashboard updates the completed count.
11. An overdue task appears in the overdue metric/badge.
12. User B cannot delete User A's task.
13. User B cannot access an unrelated task by changing its URL/task ID.
14. An unauthenticated request to a protected API returns HTTP 401.
15. Production frontend can communicate with the production backend without CORS errors.
16. Refreshing the browser preserves the Google session.



Before calling the application production-ready, verify the smoke-test checklist above against the deployed Supabase, backend and frontend environments.
### Vercel deployment:

https://vercel.com/d-s-rohith/task-manager
