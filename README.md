# Smart Budget Management

AI-powered budgeting platform for students, with transaction tracking, forecasting, overspending detection, and actionable saving recommendations.

## What It Does

- Tracks student expenses with Supabase-backed authentication and transaction storage.
- Categorizes transactions manually or from natural-language expense text.
- Uses Pandas and NumPy analytics to forecast near-term and month-end spending.
- Detects category-level overspending patterns against student-friendly budget shares.
- Provides personalized optimization recommendations and projected savings.
- Visualizes KPIs, burn rate, category breakdowns, ML insights, and forecasts in a Next.js dashboard.
- Includes an AI chat assistant that can answer questions using live spending context.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project with `supabase/schema.sql` applied
- Groq API key, optional for AI parsing and chat

## Quick Start

### 1. Database

Open your Supabase project SQL editor, then paste and run [`supabase/schema.sql`](supabase/schema.sql).

### 2. Backend

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
.\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Optional model training from `dataset/`:

```powershell
.\venv\Scripts\python.exe scripts\train_models.py
```

Confirm the API at http://127.0.0.1:8000/health.

### 3. Frontend

```powershell
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open http://127.0.0.1:3000, sign up or log in, add transactions, and view the smart dashboard.

## Project Structure

```text
backend/      FastAPI API, NLP parsing, analytics, and ML inference
frontend/     Next.js dashboard and student finance workflows
dataset/      Sample training and student finance data
supabase/     Database schema
UI/           Reference UI concepts
```
