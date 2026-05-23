# Smart Budget Management - Project Documentation

## 1) Project Summary

Smart Budget Management is an AI-powered finance assistant focused on student budgeting.

It combines:
- transaction tracking,
- balance/runway analytics,
- ML-powered forecasting and recommendations,
- chat-first guidance,
- student-context features (education profile, semester-aware planning).

Tech stack:
- **Frontend:** Next.js 16, React 19, Tailwind v4, React Query, Recharts
- **Backend:** FastAPI, Pandas, NumPy, scikit-learn, Prophet
- **Database/Auth:** Supabase (Postgres + auth + RLS)

---

## 2) Current Feature Set

### Core flows
- User signup/login with Supabase auth
- Multi-step onboarding/profile capture
- Transaction entry:
  - manual form,
  - natural language input,
  - PDF import (PhonePe/GPay parser)
- Dashboard with KPI cards and category breakdown
- Insights page with:
  - survival forecast,
  - budget health,
  - savings opportunities,
  - spending forecast,
  - peer comparison,
  - smart alerts
- Chat assistant (`Vault Advisor`) with slash commands and memory context

### Balance-aware intelligence
- Current balance and 30-day projection
- Runway days calculation
- Purchase impact checks (before/after runway)

### Student-specific context
- Education profile (type, semester, location, accommodation)
- Academic expenses and planning pages

---

## 3) Monorepo Structure

```text
backend/                     FastAPI application, ML and services
frontend/                    Next.js application (dashboard, chat, transactions)
supabase/                    SQL schema and migrations
dataset/                     Training/reference data
UI/                          UI references/assets
```

Important files:
- `backend/app/main.py` - API app and router registration
- `frontend/app/(dashboard)/layout.tsx` - global dashboard shell
- `frontend/app/globals.css` - theme tokens and design system classes
- `supabase/schema.sql` - baseline DB schema

---

## 4) Backend Architecture

### Entry point
- **File:** `backend/app/main.py`
- Routers are mounted under `/api/v1/*`.

### API modules
- `auth` -> `/api/v1/auth`
- `education` -> `/api/v1/education`
- `transactions` -> `/api/v1/transactions`
- `academic_expenses` -> `/api/v1/academic-expenses`
- `chat` -> `/api/v1/chat`
- `balance` -> `/api/v1/balance`
- `scheduled_expenses` -> `/api/v1/scheduled-expenses`
- `recurring_obligations` -> `/api/v1/recurring-obligations`
- `memory` -> `/api/v1/memory`
- `analytics` -> `/api/v1/analytics`
- `ml` -> `/api/v1/ml`
- `planning` -> `/api/v1/planning`

### Health and docs
- Root: `GET /`
- Health: `GET /health`
- Swagger/ReDoc enabled in development environment.

---

## 5) Frontend Architecture

### App routes (dashboard)
- `/chat`
- `/dashboard`
- `/transactions`
- `/insights`
- `/academic`
- `/planning`
- `/profile`

### Key UI layers
- `app/(dashboard)/layout.tsx` - sidebar, header strip, mobile nav
- `components/vault/*` - chat and balance-centric components
- `components/dashboard/*` - overview widgets/cards
- `components/transactions/*` - transaction forms/list/NL input
- `components/insights/*` - predictive analytics cards/charts

### Data fetching
- `@tanstack/react-query` hooks in `frontend/lib/hooks/*`
- Supabase client for auth/profile/settings persistence
- Axios client for backend API calls

---

## 6) Database Design (Supabase)

Baseline schema lives in:
- `supabase/schema.sql`

### Core tables used by app
- `user_profiles`
- `transactions`
- `scheduled_expenses`
- `recurring_obligations`
- `chat_conversations`
- `chat_messages`
- education/expense template tables

### Recently added migration files
- `supabase/migrations/add_user_settings.sql`
  - Adds `notification_preferences` and `privacy_settings` with RLS
- `supabase/migrations/add_transaction_type_column.sql`
  - Adds `transaction_type` for debit/credit compatibility
- `supabase/migrations/fix_transactions_schema.sql`
  - Hardens/fills missing transaction columns and constraints
- `supabase/migrations/auto_create_user_profile.sql`
  - Auto-creates `user_profiles` on signup + backfills existing users

---

## 7) Environment Variables

### Backend (`backend/.env`)
Based on `backend/.env.example`:
- `ENVIRONMENT`
- `SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GROQ_API_KEY`
- `ALLOWED_ORIGINS`

### Frontend (`frontend/.env.local`)
Based on `frontend/.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

---

## 8) Local Setup

### 8.1 Prerequisites
- Python 3.11+
- Node.js 18+
- npm
- Supabase project

### 8.2 Database setup
1. Run base schema in Supabase SQL Editor:
   - `supabase/schema.sql`
2. Run migrations in order:
   - `supabase/migrations/add_user_settings.sql`
   - `supabase/migrations/add_transaction_type_column.sql`
   - `supabase/migrations/fix_transactions_schema.sql`
   - `supabase/migrations/auto_create_user_profile.sql`

### 8.3 Backend setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Check:
- `http://127.0.0.1:8000/health`

### 8.4 Frontend setup
```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Open:
- `http://127.0.0.1:3000`

---

## 9) ML/Analytics Notes

Python dependencies include:
- `pandas`, `numpy`, `scikit-learn`, `joblib`, `prophet`

Training scripts present:
- `backend/train_models.py`
- `backend/scripts/train_models.py`

The app supports predictive snapshots consumed by the Insights page and chat context.

---

## 10) UI/Design System Notes

The current UI theme system is token-driven in:
- `frontend/app/globals.css`

Recent visual system updates include:
- layered dark surfaces (`--surface-0/1/2`),
- category color tokens,
- upgraded `vault-card` treatment,
- compact/hero variants for balance strip,
- iOS-style transaction row grouping,
- mobile responsiveness improvements.

---

## 11) Common Troubleshooting

### "Credit transactions require transaction type column"
Run:
- `supabase/migrations/add_transaction_type_column.sql`
- or `supabase/migrations/fix_transactions_schema.sql`

### Onboarding data not persisting
Run:
- `supabase/migrations/auto_create_user_profile.sql`

This ensures profile row auto-creation on auth signup.

### Port already in use (`127.0.0.1:8000`)
Stop previous backend process, then restart uvicorn.

### Frontend build check
```powershell
cd frontend
npm run build
```

---

## 12) Production Readiness Checklist

- [ ] All migrations executed in target Supabase project
- [ ] RLS policies verified for profile/settings/transactions
- [ ] Env vars set for frontend and backend
- [ ] Backend health and API docs reachable in staging
- [ ] Frontend `npm run build` succeeds
- [ ] End-to-end smoke test:
  - signup/login,
  - add transaction,
  - dashboard updates,
  - insights loads,
  - chat responds,
  - profile settings persist

---

## 13) Suggested Next Improvements

1. Add automated migration/versioning workflow for Supabase.
2. Add integration tests for onboarding/profile persistence.
3. Add responsive visual regression checks for dashboard/chat.
4. Add error boundary + retry UX around analytics widgets.
5. Add CI job for backend tests + frontend build/lint.
