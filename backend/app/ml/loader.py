"""Load trained joblib bundle from backend/model/."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

MODEL_PATH = (
    Path(__file__).resolve().parent.parent.parent / "model" / "student_financial_intelligence_models.pkl"
)
DATASET_DIR = Path(__file__).resolve().parent.parent.parent.parent / "dataset"


@lru_cache
def get_model_bundle() -> dict[str, Any] | None:
    from app.ml.bootstrap import ml_stack_available

    if not ml_stack_available() or not MODEL_PATH.exists():
        return None
    import joblib

    try:
        return joblib.load(MODEL_PATH)
    except Exception:
        return None


def models_available() -> bool:
    return get_model_bundle() is not None
