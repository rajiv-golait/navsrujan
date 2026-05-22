# Product Requirements Document
# Smart Budget Management Platform

**Version:** 1.2  
**Last Updated:** January 2024  
**Status:** MVP Specification — Locked  
**Audience:** Engineers, Designers, Evaluators

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Goals & Success Metrics](#4-product-goals--success-metrics)
5. [Core Features](#5-core-features)
6. [Architecture Overview](#6-architecture-overview)
7. [Tech Stack](#7-tech-stack)
8. [Data Model](#8-data-model)
9. [API Contract](#9-api-contract)
10. [AI/ML Design Rules](#10-aiml-design-rules)
11. [Analytics Engine](#11-analytics-engine)
12. [Security Requirements](#12-security-requirements)
13. [Frontend Patterns](#13-frontend-patterns)
14. [File Structure](#14-file-structure)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Testing Requirements](#17-testing-requirements)
18. [Out of Scope](#18-out-of-scope)
19. [Decision Log](#19-decision-log)
20. [Glossary](#20-glossary)

---

## 1. Executive Summary

Smart Budget Management Platform is a **conversational financial management app for college students** that combines a Groq-powered AI chat interface with a pure-math analytics engine to deliver education-aware financial insights, semester-wise forecasting, and long-term degree cost planning.

The core differentiator: **LLMs handle language, not numbers.** All financial calculations are performed by a deterministic analytics engine. The LLM only classifies intent, extracts entities, and formats responses. This makes the platform production-safe for financial use cases.

---

## 2. Problem Statement

College students in India face fragmented financial challenges:
- Tuition, lab fees, hostel charges, and daily expenses are tracked inconsistently (if at all)
- No tool accounts for the semester lifecycle — expenses spike at semester start (fees, books) and compress mid-semester
- Generic expense trackers treat a BTech student in a Pune hostel identically to an MBA student in Mumbai — the contexts are completely different
- Students lack a natural interface for financial questions ("will I survive till month-end?")

**Gap:** No existing tool combines NLP-based expense logging, education-context-aware analytics, and semester-phase-aware forecasting in a single student-first product.

---

## 3. Target Users

### Primary Persona — The College Student

| Attribute | Value |
|-----------|-------|
| Age | 18–26 |
| Education Types | BTech, MBA, Design, Medical |
| Location | Metro / Tier-2 / Tier-3 cities |
| Living Situation | Hostel, PG, Home, Rented |
| Financial Literacy | Low to moderate |
| Device | Mobile-first, some desktop |
| Key Pain Point | "I don't know where my money goes and I always run out before month-end" |

### User Context Fields (Required at Onboarding)

```
education_type     → BTech | MBA | Design | Medical
current_semester   → 1–8 (or per degree duration)
degree_start_date  → date
university         → string
accommodation_type → hostel | pg | home | rented
location_type      → metro | tier2 | tier3
```

---

## 4. Product Goals & Success Metrics

### Goals

| Priority | Goal |
|----------|------|
| P0 | Enable expense logging via natural language |
| P0 | Predict month-end financial survival |
| P0 | Separate academic and personal expense tracking |
| P1 | Provide semester-aware overspending alerts |
| P1 | Forecast next-month spending using Prophet/ARIMA |
| P2 | Long-term degree cost projection |
| P2 | Peer benchmarking within same education type + semester |

### Success Metrics (MVP)

- NLP transaction parsing accuracy ≥ 90% (confidence ≥ 0.7)
- Analytics API response time < 500ms
- LLM response time < 3s (Groq Llama)
- Zero hallucinated numbers in chat responses (validated via number cross-check)
- Zero cross-user data leakage (enforced via RLS)

---

## 5. Core Features

### 5.1 Natural Language Expense Logging
- User types: *"Spent 250 on pizza yesterday"*
- LLM extracts: amount, category, merchant, date, confidence
- If confidence < 0.7 → ask user to confirm
- If confidence ≥ 0.7 → auto-save to database

### 5.2 Conversational AI Financial Advisor
- Intent classification (closed set of 9 intents)
- Analytics engine computes the answer (no LLM math)
- LLM formats response in ≤150 words, conversational tone
- Number hallucination validation before returning response

### 5.3 Dashboard Analytics
- Daily burn rate (7-day rolling average)
- Month-end survival prediction with risk level (low / medium / high)
- Overspending detection (20% above 3-month average = alert)
- Category breakdown (academic vs personal separated)

### 5.4 Education-Aware Context
- Semester phase detection (start / mid / end)
- Expected vs actual expense comparison using education templates
- Academic expense calendar (fee due dates, book cycles)
- Peer comparison — only within same `education_type + semester + location_type`

### 5.5 ML-Powered Insights
- Burn rate anomaly detection (IsolationForest)
- Financial stress score (0–100)
- Spending personality clustering
- Prophet-based per-category forecast

### 5.6 Long-Term Planning
- Full degree cost projection
- Semester-level forecasting
- Funding gap analysis
- Peer benchmark comparison

---

## 6. Architecture Overview

### The Golden Rule: AI-Analytics Separation

```
User Query
    ↓
LLM — Intent Classification + Entity Extraction
    ↓
Analytics Engine — Pure Math (NO LLM)
    ↓
Structured JSON Result
    ↓
LLM — Format into Natural Language Response
    ↓
User
```

**LLM is allowed to:**
- Parse natural language
- Classify intent
- Extract entities (amount, category, date)
- Format final responses

**LLM is NOT allowed to:**
- Perform financial calculations
- Query the database
- Generate analytics or forecasts
- Handle numerical predictions

**Rationale:** Financial decisions require 100% accuracy. LLMs hallucinate numbers.

### Privacy Architecture

```
User Data → Backend Analytics → Structured JSON (no PII)
                                         ↓
                                        LLM
```

**What CAN go to LLM:** Aggregated totals, category percentages, trend indicators, risk levels

**What CANNOT go to LLM:** Individual transaction amounts, merchant names, user identifiers, exact dates, payment methods, personal information

---

## 7. Tech Stack

### Frontend (Locked)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | Framework |
| React | 18.x | UI Library |
| TypeScript | 5.x | Type Safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | Latest | Components |
| Recharts | 2.x | Charts |
| React Query | 5.x | Server State |
| Zustand | 4.x | UI State |
| Zod | 3.x | Validation |

### Backend (Locked)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Language |
| FastAPI | 0.104+ | Framework |
| Pydantic | 2.x | Validation |
| SQLAlchemy | 2.x | ORM |
| PostgreSQL | 15+ | Database |
| Supabase | Cloud | Auth + DB |

### AI/ML (Locked)

| Technology | Version | Purpose |
|------------|---------|---------|
| Groq API | Latest | LLM Inference |
| Llama 3.1 70B | — | Main Model |
| Llama 3.1 8B | — | Fast/lightweight tasks |
| Prophet | 1.1+ | Forecasting |
| scikit-learn | 1.3+ | ML Utilities (IsolationForest, clustering) |
| Pandas | 2.1+ | Data Processing |

---

## 8. Data Model

### user_profiles
Stores education context required for all analytics. RLS enforced.

Key fields: `education_type`, `university`, `current_semester`, `degree_start_date`, `expected_graduation`, `location_type`, `accommodation_type`

### transactions
All expenses (personal + academic). RLS enforced.

Key fields: `amount`, `category`, `semester_number`, `is_academic`, `entry_method` (manual / nlp / import / ocr), `confidence_score`

Valid categories: `Food`, `Transport`, `Entertainment`, `Shopping`, `Bills`, `Education`, `Health`, `Academic`, `Other`

Mandatory indexes: `(user_id, transaction_date DESC)`, `(user_id, category)`, `(user_id, semester_number)`

### education_templates *(must be seeded)*
Predefined templates for BTech / MBA / Design / Medical with semester structure.

### expense_templates *(must be seeded)*
Expected expense ranges per education template and semester. Used for peer benchmarking and anomaly flags.

### academic_expenses
One-time or recurring academic costs (tuition, lab fees, books). Tracked separately from daily transactions.

Key fields: `expense_name`, `semester_number`, `payment_status` (paid / pending / partial / overdue), `is_planned`

### chat_conversations + chat_messages
Full chat history per user. Assistant messages store `analytics_snapshot` (JSONB) — the exact data used to generate the response.

---

## 9. API Contract

### Auth
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Education Context
```
GET    /api/v1/education/templates
GET    /api/v1/education/templates/{id}
POST   /api/v1/education/profile/setup
GET    /api/v1/education/profile/context
GET    /api/v1/education/semester/{num}/expenses
```

### Transactions
```
POST   /api/v1/transactions/add-natural      ← NLP entry
POST   /api/v1/transactions                  ← Manual entry
GET    /api/v1/transactions
GET    /api/v1/transactions/{id}
PUT    /api/v1/transactions/{id}
DELETE /api/v1/transactions/{id}
```

### Academic Expenses
```
POST   /api/v1/academic-expenses
GET    /api/v1/academic-expenses/semester/{num}
GET    /api/v1/academic-expenses/upcoming
GET    /api/v1/academic-expenses/missing-suggestions
```

### Analytics (No LLM)
```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/survival-check
GET    /api/v1/analytics/overspending
GET    /api/v1/analytics/category/{category}
GET    /api/v1/analytics/semester/{num}/analysis
```

### ML Analytics (Statistical Models)
```
GET    /api/v1/ml/burn-rate
GET    /api/v1/ml/anomalies
GET    /api/v1/ml/stress-score
GET    /api/v1/ml/forecast/{category}
GET    /api/v1/ml/spending-personality
```

### Planning
```
POST   /api/v1/planning/degree-projection
GET    /api/v1/planning/semester/{num}/forecast
POST   /api/v1/planning/funding-gap-analysis
GET    /api/v1/planning/peer-comparison
```

### Chat
```
POST   /api/v1/chat/query
GET    /api/v1/chat/conversations
GET    /api/v1/chat/conversations/{id}/messages
DELETE /api/v1/chat/conversations/{id}
```

---

## 10. AI/ML Design Rules

### Allowed Intents (Closed Set)

| Intent | Trigger Keywords |
|--------|-----------------|
| `SPENDING_ANALYSIS` | overspending, where am i spending, biggest expense |
| `SURVIVAL_CHECK` | survive, month end, run out of money |
| `CATEGORY_QUERY` | how much on, spent on food, transport cost |
| `FORECAST` | predict, forecast, next month |
| `RECOMMENDATION` | how to save, reduce spending, cut down |
| `SEMESTER_PLANNING` | semester cost, academic expenses |
| `DEGREE_PROJECTION` | total degree cost, complete college |
| `PEER_COMPARISON` | compare with others, average spending |
| `TRANSACTION_ADD` | spent, paid, bought |

### Intent Classification Order
1. Fast keyword matching (no LLM call)
2. LLM classification as fallback
3. Validate output is in allowed set → else default `GENERAL`

### NLP Parsing — Confidence Gating
- `confidence ≥ 0.7` → auto-save transaction
- `confidence < 0.7` → return `needs_confirmation` + parsed data for user review

### LLM Response Rules
- Never make up numbers
- Only use data from `analytics_result` dict
- ≤150 words
- After generation: cross-validate all numbers in response against `analytics_result`
- If validation fails → fall back to template response (never return hallucinated output)

### Prompt Injection Protection
Block patterns: `ignore previous instructions`, `disregard`, `you are now`, `system prompt`, LLML control tokens

Max input length: 500 characters

---

## 11. Analytics Engine

All functions are pure Python — no LLM, no side effects.

### Burn Rate
```
daily_burn_rate    = sum(last 7 days spending) / 7
projected_monthly  = daily_burn_rate × 30
```

### Survival Prediction
```
projected_spending = daily_burn_rate × days_remaining_in_month
projected_balance  = current_balance − projected_spending

risk_level:
  > 20% buffer remaining  → "low"   / "safe"
  > 0 remaining           → "medium" / "tight"
  ≤ 0                     → "high"  / "deficit"
```

### Overspending Detection
```
threshold = 20% above 3-month category average
deviation = ((current_month − avg_3_months) / avg_3_months) × 100
flag if deviation > 20
```

Results sorted by deviation (descending).

### Education-Context Rules
- **Always** filter peer comparisons to same `education_type + semester + location_type`
- **Always** separate `is_academic = true` and `is_academic = false` in all aggregate queries
- **Never** use total spending without academic/personal breakdown

---

## 12. Security Requirements

### Authentication
- **Always** extract `user_id` from verified JWT via `Depends(get_current_user)`
- **Never** accept `user_id` from query params or request body

### Row Level Security (RLS)
All tables with `user_id` must have RLS enabled with policies for SELECT, INSERT, UPDATE, DELETE.

### Input Validation (Pydantic)
- `amount`: float, `> 0`, `≤ 1,000,000`
- `category`: enum from valid set
- `transaction_date`: not in future, not older than 1 year
- `merchant/description`: max length enforced

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /transactions/add-natural` | 20/min |
| `POST /chat/query` | 30/min |
| `GET /analytics/dashboard` | 60/min |

---

## 13. Frontend Patterns

### Data Fetching — React Query (Required)
- Use `useQuery` for server data — never `useState + useEffect`
- `staleTime: 5 minutes` for dashboard data
- Always handle `isLoading` and `error` states with skeleton/error components

### Forms — React Hook Form + Zod (Required)
- All forms use `useForm` with `zodResolver`
- Validation schema mirrors backend Pydantic model
- Never manually track form state with `useState`

### Component Structure
- Separate data fetching logic from UI rendering
- Wrap pages with `<ErrorBoundary>` and `<Suspense fallback={<Skeleton />}>`
- Use server components for static layout, client components for interactive parts

---

## 14. File Structure

### Backend
```
backend/app/
├── api/v1/          ← Route handlers (auth, transactions, analytics, chat, ml_analytics)
├── core/            ← Config, database, security (JWT)
├── models/          ← SQLAlchemy models
├── schemas/         ← Pydantic schemas
├── services/        ← Business logic
├── analytics/       ← Pure math engine (NO LLM) + forecasting + anomaly detection
├── llm/             ← Groq client, prompts, NL parsers
└── middleware/      ← Auth, rate limit, logging
```

### Frontend
```
frontend/
├── app/
│   ├── (auth)/          ← login, signup
│   ├── (dashboard)/     ← dashboard, transactions, academic, planning, chat, insights
│   └── onboarding/      ← education profile setup
├── components/          ← UI components by domain
├── lib/
│   ├── api.ts           ← Axios client
│   ├── supabase.ts
│   └── hooks/           ← useAuth, useTransactions, useAnalytics, useEducationContext
└── types/               ← TypeScript interfaces
```

---

## 15. Environment Variables

### Backend
```
SUPABASE_URL          (required)
SUPABASE_KEY          (required)
SUPABASE_SERVICE_KEY  (required)
GROQ_API_KEY          (required)
SECRET_KEY            (required, min 32 chars)
ENVIRONMENT           (optional, default: development)
ALLOWED_ORIGINS       (optional)
```

### Frontend
```
NEXT_PUBLIC_SUPABASE_URL       (required)
NEXT_PUBLIC_SUPABASE_ANON_KEY  (required)
NEXT_PUBLIC_API_URL            (required)
```

---

## 16. Deployment

### Frontend — Vercel
- Framework: Next.js
- Build command: `npm run build`
- Env vars injected via Vercel secrets

### Backend — Railway / Render
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
- Health check: `GET /health`
- Restart policy: on failure

---

## 17. Testing Requirements

### Backend (Must Have)

| Test | Assertion |
|------|-----------|
| Burn rate calculation | `projected_monthly == daily_burn_rate × 30` |
| Survival prediction | `risk_level` ∈ {low, medium, high}, `status` ∈ {safe, tight, deficit} |
| Overspending detection | All flagged categories have `deviation_percent > 20` |
| NLP parser confidence | Low-confidence inputs return `needs_confirmation` |

### Frontend (Should Have)
- Dashboard renders loading skeleton before data
- Burn rate displays ₹ formatted value
- Add transaction form validates amount > 0 and date not in future

---

## 18. Out of Scope

The following are explicitly excluded from this product:

- Cryptocurrency or investment features
- Peer-to-peer payment
- Bank account aggregation / OFX / UPI integration
- Loan or credit management
- Generic expense tracking without AI layer
- Hackathon-style fake data or mock analytics
- LLM-generated financial calculations (ever)

---

## 19. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Provider | Groq (not OpenAI) | 10× cheaper, 2–3× faster, better privacy |
| Forecasting | Prophet (not LSTM) | Students have 50–200 tx/month — too sparse for deep learning; Prophet gives confidence intervals |
| Database | Supabase / PostgreSQL (not Firebase) | Relational data model, native RLS, SQL query language |
| Server State | React Query (not Redux) | Purpose-built for API data, automatic caching, less boilerplate |

---

## 20. Glossary

| Term | Definition |
|------|------------|
| Burn Rate | Daily average spending rate (7-day rolling) |
| Academic Expense | Education-related cost (tuition, books, lab fees) |
| Personal Expense | Daily living cost (food, transport, entertainment) |
| Semester Context | Current semester number + expected expense profile |
| Education Template | Predefined expense expectations per degree type |
| Survival Check | Prediction of whether user reaches month-end without deficit |
| Anomaly | Transaction statistically different from user's normal pattern |
| Stress Score | 0–100 index of financial pressure |
| Peer Comparison | Benchmarking against users with same education type, semester, and location tier |
| Confidence Score | LLM certainty for NLP-parsed transactions (0.0–1.0); < 0.7 triggers confirmation step |

---

*This document is the single source of truth for the Smart Budget Management Platform. All architectural decisions are locked unless explicitly revised here. Engineers should not implement features not covered in this PRD without updating this document first.*
