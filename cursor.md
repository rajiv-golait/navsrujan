# Cursor AI Development Prompt - Smart Budget Management Platform

---

## 🎯 Project Brief for Cursor AI

Copy and paste this entire prompt into Cursor AI to begin development:

---

```markdown
# PROJECT: Smart Budget Management for Students - Full Stack Development

You are tasked with building a production-grade financial management platform for college students. This is NOT a simple expense tracker - it's an AI-powered conversational budgeting assistant with education-aware financial intelligence.

---

## 📋 PROJECT OVERVIEW

### Core Problem
Students struggle with:
- Irregular spending habits and poor financial awareness
- Lack of budgeting discipline
- No understanding of semester-wise expense patterns
- Absence of personalized financial guidance
- No long-term degree cost planning

### Solution
An AI-powered platform that:
✅ Tracks both personal and academic expenses separately
✅ Understands education type (BTech, MBA, Design, Medical) and semester context
✅ Categorizes transactions automatically using natural language
✅ Predicts future spending patterns with semester-aware forecasting
✅ Detects overspending behavior with peer comparison
✅ Provides conversational financial advice via LLM
✅ Projects complete degree costs (multi-year planning)
✅ Visualizes financial behavior through interactive dashboards

### Key Differentiator
**Separation of Intelligence**: 
- AI (Groq LLM) handles natural language understanding and explanations
- Analytics Engine handles all calculations and predictions
- This prevents AI hallucinations while maintaining conversational UX

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS + shadcn/ui components
- Recharts for data visualization
- React Query for state management
- Zustand for global state

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy ORM
- Pydantic for validation
- Uvicorn server

**Database & Auth:**
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) policies
- JWT token authentication

**AI/ML:**
- Groq API (Llama 3.1 models)
- Prophet for time series forecasting
- Pandas/NumPy for analytics
- Statistical methods (no deep learning needed)

**Deployment:**
- Frontend: Vercel
- Backend: Railway/Render
- Database: Supabase Cloud

---

## 📊 DATABASE SCHEMA

### Core Tables (Implement these first)

#### 1. user_profiles (extends Supabase auth.users)
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    college TEXT,
    course TEXT,
    year INTEGER,
    monthly_budget DECIMAL(10, 2),
    
    -- Education context (NEW)
    education_type VARCHAR(50),  -- 'BTech', 'Management', 'Design', 'Medical'
    university VARCHAR(200),
    degree_duration INTEGER DEFAULT 4,
    current_semester INTEGER,
    semester_system VARCHAR(20) DEFAULT 'semester',
    degree_start_date DATE,
    expected_graduation DATE,
    location_type VARCHAR(50),  -- 'metro', 'tier2', 'tier3'
    accommodation_type VARCHAR(50),  -- 'hostel', 'home', 'pg'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

#### 2. transactions (personal expenses)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    merchant TEXT,
    description TEXT,
    
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    entry_method VARCHAR(20) DEFAULT 'manual',  -- 'manual', 'nlp', 'import'
    source_text TEXT,
    confidence_score DECIMAL(3, 2),
    
    semester_number INTEGER,  -- NEW: link to semester
    is_academic BOOLEAN DEFAULT FALSE,  -- NEW: flag academic expenses
    
    CONSTRAINT valid_category CHECK (
        category IN ('Food', 'Transport', 'Entertainment', 'Shopping', 
                     'Bills', 'Education', 'Health', 'Other', 'Academic')
    )
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
```

#### 3. education_templates
```sql
CREATE TABLE education_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200),
    education_type VARCHAR(50) NOT NULL,
    
    total_duration_years INTEGER NOT NULL,
    semester_system VARCHAR(20) DEFAULT 'semester',
    semesters_per_year INTEGER DEFAULT 2,
    total_semesters INTEGER,
    
    typical_categories JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO education_templates (template_name, display_name, education_type, total_duration_years, total_semesters) VALUES
('BTECH_4Y', 'B.Tech (4 Year)', 'BTech', 4, 8),
('MBA_2Y', 'MBA (2 Year)', 'Management', 2, 4),
('DESIGN_4Y', 'Design (4 Year)', 'Design', 4, 8);
```

#### 4. expense_templates (predefined semester expenses)
```sql
CREATE TABLE expense_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES education_templates(id) ON DELETE CASCADE,
    semester_number INTEGER,  -- NULL means all semesters
    
    expense_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    typical_amount_min DECIMAL(10, 2),
    typical_amount_max DECIMAL(10, 2),
    typical_amount_avg DECIMAL(10, 2),
    
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    typical_occurrence_week INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expense_template_lookup ON expense_templates(template_id, semester_number);
```

#### 5. academic_expenses
```sql
CREATE TABLE academic_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_template_id UUID REFERENCES expense_templates(id),
    
    expense_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    
    semester_number INTEGER NOT NULL,
    academic_year VARCHAR(20),
    
    payment_date DATE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'paid',
    payment_method VARCHAR(50),
    
    is_planned BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_academic_expenses_user ON academic_expenses(user_id, semester_number);

ALTER TABLE academic_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own academic expenses" ON academic_expenses FOR ALL USING (auth.uid() = user_id);
```

#### 6. chat_conversations & chat_messages
```sql
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    intent VARCHAR(50),
    analytics_snapshot JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at ASC);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 🔧 PROJECT STRUCTURE

### Backend Structure (FastAPI)
```
backend/
├── app/
│   ├── main.py                 # FastAPI app initialization
│   ├── __init__.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py         # Authentication endpoints
│   │       ├── transactions.py  # Transaction CRUD
│   │       ├── analytics.py    # Analytics endpoints
│   │       ├── chat.py         # Chat interface
│   │       ├── education.py    # Education context (NEW)
│   │       ├── academic_expenses.py  # Academic tracking (NEW)
│   │       └── planning.py     # Long-term planning (NEW)
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Settings & environment
│   │   ├── database.py         # SQLAlchemy setup
│   │   └── security.py         # JWT validation
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── education.py        # NEW models
│   │   └── chat.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas
│   │   ├── transaction.py
│   │   ├── education.py        # NEW schemas
│   │   └── chat.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── transaction_service.py
│   │   ├── analytics_service.py
│   │   ├── chat_service.py
│   │   ├── forecast_service.py
│   │   ├── nlp_service.py
│   │   ├── education_service.py      # NEW
│   │   ├── academic_expense_service.py  # NEW
│   │   └── long_term_planning_service.py  # NEW
│   │
│   ├── analytics/
│   │   ├── __init__.py
│   │   ├── engine.py           # Core analytics (NO AI)
│   │   ├── forecasting.py      # Prophet/statistical
│   │   ├── anomaly.py          # Outlier detection
│   │   └── context_aware_engine.py  # NEW: Education-aware
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── groq_client.py      # Groq API wrapper
│   │   ├── prompts.py          # Prompt templates
│   │   └── parsers.py          # NL parsing logic
│   │
│   └── middleware/
│       ├── __init__.py
│       ├── auth.py
│       ├── rate_limit.py
│       └── logging.py
│
├── tests/
│   ├── test_analytics.py
│   ├── test_nlp.py
│   └── test_education_service.py
│
├── requirements.txt
├── .env.example
└── README.md
```

### Frontend Structure (Next.js)
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Landing page
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard layout with nav
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard
│   │   ├── transactions/
│   │   │   └── page.tsx        # Transaction list
│   │   ├── academic/           # NEW
│   │   │   └── page.tsx        # Academic expenses
│   │   ├── planning/           # NEW
│   │   │   └── page.tsx        # Long-term planning
│   │   ├── chat/
│   │   │   └── page.tsx        # AI chat interface
│   │   └── insights/
│   │       └── page.tsx        # AI insights
│   │
│   └── onboarding/
│       └── page.tsx            # Education setup (NEW)
│
├── components/
│   ├── ui/                     # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── dashboard/
│   │   ├── BurnRateGauge.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── CurrentMonthSummary.tsx
│   │   ├── EducationContextCard.tsx  # NEW
│   │   └── SemesterProgressCard.tsx  # NEW
│   │
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── AddTransactionForm.tsx
│   │   └── NaturalLanguageInput.tsx
│   │
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── ChatBubble.tsx
│   │   └── SuggestedQueries.tsx
│   │
│   ├── education/              # NEW
│   │   ├── EducationSetup.tsx
│   │   ├── SemesterTimeline.tsx
│   │   └── AcademicExpenseList.tsx
│   │
│   └── planning/               # NEW
│       ├── DegreeProjection.tsx
│       ├── SemesterForecast.tsx
│       └── FundingGapAnalysis.tsx
│
├── lib/
│   ├── api.ts                  # API client
│   ├── supabase.ts            # Supabase client
│   ├── utils.ts               # Utility functions
│   └── hooks/
│       ├── useAuth.ts
│       ├── useTransactions.ts
│       ├── useAnalytics.ts
│       └── useEducationContext.ts  # NEW
│
├── types/
│   ├── index.ts
│   ├── transaction.ts
│   ├── analytics.ts
│   └── education.ts           # NEW
│
├── styles/
│   └── globals.css
│
├── public/
│   └── ...
│
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 DEVELOPMENT PHASES

### PHASE 1: Project Setup & Core Infrastructure (Start Here)

**Task 1.1: Initialize Backend**
```bash
# Create backend structure
mkdir -p backend/app/{api/v1,core,models,schemas,services,analytics,llm,middleware}
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

Create `requirements.txt`:
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
supabase==2.0.3
groq==0.4.0
pandas==2.1.3
numpy==1.26.2
prophet==1.1.5
slowapi==0.1.9
python-dotenv==1.0.0
redis==5.0.1
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, transactions, analytics, chat, education, academic_expenses, planning

app = FastAPI(
    title="Smart Budget Management API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(education.router, prefix="/api/v1/education", tags=["Education"])
app.include_router(academic_expenses.router, prefix="/api/v1/academic-expenses", tags=["Academic Expenses"])
app.include_router(planning.router, prefix="/api/v1/planning", tags=["Planning"])

@app.get("/")
async def root():
    return {"message": "Smart Budget Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

Create `app/core/config.py`:
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Groq
    GROQ_API_KEY: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

Create `.env.example`:
```env
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

GROQ_API_KEY=your-groq-api-key

ALLOWED_ORIGINS=["http://localhost:3000"]
```

**Task 1.2: Initialize Frontend**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @supabase/supabase-js @tanstack/react-query zustand recharts axios date-fns
npx shadcn-ui@latest init
```

Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create `lib/api.ts`:
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

Create `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### PHASE 2: Authentication & User Management

**Backend: Implement Supabase Auth**

Create `app/core/security.py`:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

security = HTTPBearer()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return {"id": user.id, "email": user.email}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
```

Create `app/api/v1/auth.py`:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.security import supabase

router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(request: SignupRequest):
    try:
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if auth_response.user:
            # Create user profile
            supabase.table('user_profiles').insert({
                "id": auth_response.user.id,
                "full_name": request.full_name,
                "email": request.email
            }).execute()
        
        return {"user": auth_response.user, "session": auth_response.session}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        return {"user": auth_response.user, "session": auth_response.session}
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")
```

**Frontend: Auth Pages**

Create `app/(auth)/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      localStorage.setItem('access_token', data.session.access_token);
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### PHASE 3: Core Transaction Management

**Backend: Transaction Service**

Create `app/services/transaction_service.py`:
```python
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate

class TransactionService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_transaction(self, user_id: str, transaction_data: TransactionCreate) -> Transaction:
        """Create a new transaction"""
        transaction = Transaction(
            user_id=user_id,
            **transaction_data.dict()
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def get_user_transactions(
        self, 
        user_id: str, 
        limit: int = 50, 
        offset: int = 0,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Transaction]:
        """Get user's transactions with filters"""
        query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
        
        if category:
            query = query.filter(Transaction.category == category)
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        
        return query.order_by(Transaction.transaction_date.desc()).offset(offset).limit(limit).all()
```

Create `app/api/v1/transactions.py`:
```python
from fastapi import APIRouter, Depends
from typing import List
from app.core.security import get_current_user
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter()

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new transaction"""
    service = TransactionService(db)
    return service.create_transaction(current_user["id"], transaction)

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's transactions"""
    service = TransactionService(db)
    return service.get_user_transactions(current_user["id"], limit=limit)
```

---

## 🎯 CRITICAL ARCHITECTURAL PRINCIPLES

### 1. AI Pipeline Flow (MUST FOLLOW)
```
User Input → LLM (Parse) → Structured Data → Database
User Query → Intent Classifier → Analytics Engine (Pure Math) → Structured Results → LLM (Format) → Response
```

**DO:**
✅ Use LLM for natural language understanding
✅ Use LLM for formatting responses
✅ Use Analytics Engine for ALL calculations
✅ Always validate LLM output

**DON'T:**
❌ Let LLM perform calculations
❌ Let LLM query database directly
❌ Trust LLM output without validation
❌ Use LLM for forecasting

### 2. Analytics Engine Implementation

Create `app/analytics/engine.py`:
```python
class FinancialAnalyticsEngine:
    """
    Pure computational engine - NO LLM
    All methods return structured dictionaries
    """
    
    def calculate_burn_rate(self, user_id: str, period_days: int = 30) -> dict:
        """
        Calculate daily spending rate
        Returns: {"daily_burn_rate": float, "projected_monthly": float}
        """
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.date >= datetime.now() - timedelta(days=period_days)
        ).all()
        
        total_spent = sum(t.amount for t in transactions)
        daily_burn_rate = total_spent / period_days
        
        return {
            "daily_burn_rate": round(daily_burn_rate, 2),
            "projected_monthly": round(daily_burn_rate * 30, 2),
            "period_spent": round(total_spent, 2)
        }
    
    def predict_month_end_survival(self, user_id: str) -> dict:
        """
        Calculate if user can survive till month end
        Pure math - NO AI
        """
        user = self.db.query(User).get(user_id)
        current_balance = user.monthly_budget  # or actual balance
        
        burn_rate = self.calculate_burn_rate(user_id, period_days=7)
        days_remaining = self._get_days_remaining_in_month()
        
        projected_spending = burn_rate["daily_burn_rate"] * days_remaining
        projected_balance = current_balance - projected_spending
        
        return {
            "current_balance": current_balance,
            "daily_burn_rate": burn_rate["daily_burn_rate"],
            "days_remaining": days_remaining,
            "projected_spending": round(projected_spending, 2),
            "projected_balance": round(projected_balance, 2),
            "risk_level": "high" if projected_balance < 0 else "medium" if projected_balance < current_balance * 0.2 else "low"
        }
```

### 3. LLM Usage Pattern

Create `app/llm/groq_client.py`:
```python
from groq import Groq
from app.core.config import settings

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    async def parse_expense(self, text: str, context: dict) -> dict:
        """
        Extract structured transaction from natural language
        """
        system_prompt = """You are an expense parser. Extract transaction details.
        
        Output JSON schema:
        {
            "amount": float,
            "category": str (one of: Food, Transport, Entertainment, Shopping, Bills, Education, Health, Other),
            "merchant": str or null,
            "description": str or null,
            "transaction_date": str (ISO format),
            "confidence": float (0-1)
        }
        
        IMPORTANT: Never invent amounts. If unclear, set confidence < 0.5
        """
        
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current date: {context['current_date']}\n\nParse: {text}"}
            ],
            model="llama-3.1-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def format_analytics_response(self, query: str, analytics_result: dict) -> str:
        """
        Convert structured analytics into conversational response
        """
        system_prompt = """You are a financial advisor for students.
        
        CRITICAL RULES:
        - NEVER make up numbers
        - ONLY use data from analytics_result
        - Be conversational and empathetic
        - Keep under 150 words
        """
        
        user_prompt = f"""
        User query: "{query}"
        
        Analytics result:
        {json.dumps(analytics_result, indent=2)}
        
        Explain this conversationally.
        """
        
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-70b-versatile",
            temperature=0.7
        )
        
        return response.choices[0].message.content
```

---

## 📝 IMMEDIATE TASKS FOR YOU (Cursor AI)

### Task Priority 1: Setup Project Structure
1. Create backend folder structure as specified
2. Create frontend folder structure as specified
3. Initialize both projects with package managers
4. Set up environment files

### Task Priority 2: Database Setup
1. Connect to Supabase
2. Create all tables with RLS policies
3. Add seed data for education_templates
4. Test database connections

### Task Priority 3: Basic Authentication
1. Implement backend auth endpoints
2. Implement frontend login/signup pages
3. Add JWT middleware
4. Test authentication flow

### Task Priority 4: Transaction Management
1. Implement transaction CRUD backend
2. Create transaction models and schemas
3. Build transaction list frontend
4. Add manual transaction entry form

### Task Priority 5: Analytics Foundation
1. Implement FinancialAnalyticsEngine
2. Add burn rate calculation
3. Create dashboard endpoint
4. Build basic dashboard frontend

---

## 🎨 UI/UX GUIDELINES

### Design System (TailwindCSS + shadcn/ui)
- Primary color: Purple (#9C27B0) for AI features
- Accent color: Orange (#FF9800) for analytics
- Success: Green (#4CAF50)
- Warning: Amber (#FFC107)
- Danger: Red (#F44336)

### Component Patterns
```typescript
// Card pattern
<Card>
  <CardHeader>
    <CardTitle>Monthly Summary</CardTitle>
    <CardDescription>Your spending this month</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Stat component
<div className="bg-white p-6 rounded-lg shadow">
  <p className="text-sm text-gray-600">Total Spent</p>
  <p className="text-3xl font-bold">₹{amount.toLocaleString()}</p>
  <p className="text-sm text-green-600">↓ 12% vs last month</p>
</div>
```

---

## 🔒 SECURITY REQUIREMENTS

1. **Always use RLS policies** - Every table must have RLS
2. **Validate all inputs** - Use Pydantic schemas
3. **Rate limit LLM calls** - Max 30 requests/minute per user
4. **Sanitize user input** - Before sending to LLM
5. **Never expose service keys** - Use environment variables
6. **Implement CORS properly** - Whitelist frontend origin only

---

## 🧪 TESTING STRATEGY

Create tests for:
- Analytics calculations (most critical)
- LLM parsing accuracy
- API endpoints
- Authentication flow
- Data validation

Example test:
```python
def test_burn_rate_calculation():
    engine = FinancialAnalyticsEngine(db)
    result = engine.calculate_burn_rate(user_id="test", period_days=30)
    
    assert "daily_burn_rate" in result
    assert result["daily_burn_rate"] >= 0
    assert result["projected_monthly"] == result["daily_burn_rate"] * 30
```

---

## 📦 DEPLOYMENT CHECKLIST

Before deploying:
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] CORS configured for production
- [ ] API rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoint working
- [ ] Frontend environment variables set
- [ ] Build succeeds without errors

---

## 🎯 SUCCESS CRITERIA

The MVP is complete when a user can:
1. ✅ Sign up and set up education profile (BTech/MBA/Design)
2. ✅ Add transactions using natural language ("spent 250 on pizza")
3. ✅ View dashboard with burn rate and category breakdown
4. ✅ See current semester context and upcoming academic expenses
5. ✅ Ask questions in chat ("Where am I overspending?")
6. ✅ Get AI-powered responses based on real analytics
7. ✅ View semester-wise expense breakdown
8. ✅ See degree completion cost projection

---

## ⚠️ COMMON PITFALLS TO AVOID

1. **Don't let LLM do math** - Always use Analytics Engine
2. **Don't skip RLS policies** - Security is critical
3. **Don't over-engineer** - Start simple, iterate
4. **Don't ignore error handling** - Fail gracefully
5. **Don't hardcode values** - Use configuration
6. **Don't forget to validate LLM output** - Always check schema
7. **Don't expose sensitive data to LLM** - Minimize PII

---

## 📚 RESOURCES

- FastAPI docs: https://fastapi.tiangolo.com/
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- Groq API: https://console.groq.com/docs
- Prophet docs: https://facebook.github.io/prophet/
- shadcn/ui: https://ui.shadcn.com/

---

## 🚀 START DEVELOPMENT

Begin with:
1. Set up backend project structure
2. Set up frontend project structure
3. Configure Supabase connection
4. Implement authentication
5. Build transaction management
6. Create basic dashboard

Ask me if you need clarification on any component!
```

---

## 📋 Additional Context Files to Provide

After pasting the main prompt, also create these files in your project:

### 1. `ARCHITECTURE.md` (Paste our full architecture doc)
### 2. `DATABASE_SCHEMA.sql` (All table creation scripts)
### 3. `API_ENDPOINTS.md` (Complete API reference)
### 4. `SYNTHETIC_DATA_README.md` (How to use the CSV files)

---

## 💡 How to Use This with Cursor

1. **Open Cursor AI**
2. **Create new workspace** for the project
3. **Paste the entire prompt** into Cursor Chat
4. **Start with**: "Let's begin by setting up the backend project structure. Create all folders and initial files."
5. **Then ask**: "Now set up the frontend Next.js project with TypeScript and Tailwind."
6. **Continue step-by-step** through each phase

Cursor will:
- Generate all boilerplate code
- Create proper folder structures
- Implement authentication
- Build API endpoints
- Create React components
- Set up proper TypeScript types
- Follow best practices

---

## 🎯 Example First Messages to Cursor

**Message 1:**
```
I've provided you with the complete project specification above. Let's start development.

First, create the backend folder structure with all necessary files and install dependencies. Use Python 3.11+ and FastAPI.
```

**Message 2:**
```
Now create the main.py file with proper FastAPI setup, CORS configuration, and router includes as specified.
```

**Message 3:**
```
Implement the Supabase authentication system with get_current_user dependency and JWT validation.
```

**Message 4:**
```
Create the transaction service with CRUD operations and the transactions API endpoints.
```

Continue step-by-step through the architecture!