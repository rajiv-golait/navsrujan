"""Detect optional ML stack without importing heavy modules at app startup."""

from __future__ import annotations

_ml_stack_available: bool | None = None


def ml_stack_available() -> bool:
    global _ml_stack_available
    if _ml_stack_available is None:
        try:
            import joblib  # noqa: F401
            import numpy  # noqa: F401
            import pandas  # noqa: F401
            import sklearn  # noqa: F401

            _ml_stack_available = True
        except ImportError:
            _ml_stack_available = False
    return _ml_stack_available
