#!/usr/bin/env python3
"""Train ML models from dataset/ and export joblib bundle."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.ml.train import save_models, train_from_dataset  # noqa: E402

DATASET_DIR = ROOT.parent / "dataset"
OUTPUT = ROOT / "model" / "student_financial_intelligence_models.pkl"


def main() -> None:
    if not DATASET_DIR.exists():
        raise SystemExit(f"Dataset not found: {DATASET_DIR}")

    print(f"Training from {DATASET_DIR} ...")
    bundle = train_from_dataset(DATASET_DIR)
    path = save_models(bundle, OUTPUT)
    print(f"Saved {path}")
    print(
        f"Rows: {bundle['training_rows']}, Users: {bundle['training_users']}"
    )


if __name__ == "__main__":
    main()
