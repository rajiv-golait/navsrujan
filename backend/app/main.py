from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    academic_expenses,
    analytics,
    auth,
    balance,
    chat,
    education,
    memory,
    ml,
    planning,
    recurring_obligations,
    scheduled_expenses,
    transactions,
)
from app.core.config import settings

app = FastAPI(
    title="Smart Budget Management API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(
    education.router,
    prefix="/api/v1/education",
    tags=["Education"],
)
app.include_router(
    transactions.router,
    prefix="/api/v1/transactions",
    tags=["Transactions"],
)
app.include_router(
    academic_expenses.router,
    prefix="/api/v1/academic-expenses",
    tags=["Academic Expenses"],
)
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(balance.router, prefix="/api/v1/balance", tags=["Balance"])
app.include_router(
    scheduled_expenses.router,
    prefix="/api/v1/scheduled-expenses",
    tags=["Scheduled Expenses"],
)
app.include_router(
    recurring_obligations.router,
    prefix="/api/v1/recurring-obligations",
    tags=["Recurring Obligations"],
)
app.include_router(memory.router, prefix="/api/v1/memory", tags=["Memory"])
app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["Analytics"],
)
app.include_router(
    ml.router,
    prefix="/api/v1/ml",
    tags=["ML Analytics"],
)
app.include_router(
    planning.router,
    prefix="/api/v1/planning",
    tags=["Planning"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Smart Budget Management API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
