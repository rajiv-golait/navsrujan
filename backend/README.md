# Smart Budget Management — Backend

FastAPI backend for the Smart Budget Management platform.

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env         # fill in your Supabase + Groq keys
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Phase 5 — AI Layer

1. Run [`supabase/schema_chat.sql`](../supabase/schema_chat.sql) in Supabase SQL editor.
2. Install AI dependencies: `pip install groq==0.11.0` (slowapi optional; built-in rate limiter used).
3. Ensure `GROQ_API_KEY` is set in `.env`.
4. Restart the server.

Endpoints: `POST /api/v1/transactions/parse`, `POST /api/v1/chat/message`, `GET /api/v1/chat/conversations`.

## Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (server-side only) |
| `GROQ_API_KEY` | Groq API key (reserved for AI phases) |
| `ALLOWED_ORIGINS` | JSON list of allowed CORS origins |
