"""Train models from dataset/ CSVs — mirrors MITHACKATHON.ipynb."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.ml.features import engineer_features

DATASET_DIR = Path(__file__).resolve().parent.parent.parent.parent / "dataset"

CLUSTER_LABELS = [
    "disciplined_saver",
    "impulsive_spender",
    "budget_survivor",
    "social_spender",
    "balanced_spender",
]

ANOMALY_FEATURES = [
    "amount",
    "rolling_7d_spend",
    "impulsive_score",
    "budget_utilization",
]

CLUSTER_AGG_FEATURES = [
    "amount",
    "is_weekend",
    "budget_utilization",
    "impulsive_score",
    "subscription_burden",
]


def _load_dataset(dataset_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    transactions = pd.read_csv(dataset_dir / "transactions.csv")
    user_profiles = pd.read_csv(dataset_dir / "user_profiles.csv")

    transactions["transaction_date"] = pd.to_datetime(transactions["transaction_date"])
    transactions = transactions.drop_duplicates(subset=["transaction_id"])
    transactions = transactions[transactions["amount"] > 0]

    if "transaction_time" in transactions.columns:
        transactions["full_date"] = pd.to_datetime(
            transactions["transaction_date"].astype(str)
            + " "
            + transactions["transaction_time"].astype(str)
        )
    else:
        transactions["full_date"] = transactions["transaction_date"]
    transactions["hour"] = transactions["full_date"].dt.hour

    return transactions, user_profiles


def _build_global_feature_df(
    transactions: pd.DataFrame, user_profiles: pd.DataFrame
) -> pd.DataFrame:
    frames = []
    for user_id in transactions["user_id"].unique():
        user_txns = transactions[transactions["user_id"] == user_id]
        profile_row = user_profiles[user_profiles["user_id"] == user_id]
        if profile_row.empty:
            continue
        profile = profile_row.iloc[0].to_dict()
        txn_dicts = user_txns.to_dict("records")
        feat = engineer_features(txn_dicts, profile)
        if not feat.empty:
            feat["user_id"] = user_id
            frames.append(feat)

    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def _apply_stress_scores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "is_anomaly" not in df.columns:
        df["is_anomaly"] = False

    stress_components = {
        "spending_velocity": df["rolling_7d_spend"] / df["monthly_budget"].clip(lower=1) * 100,
        "academic_load": df["semester_pressure"] * 25,
        "anomaly_density": df["is_anomaly"].astype(int) * 15,
        "recurring_burden": (df["subscription_burden"] / df["monthly_budget"].clip(lower=1)) * 30,
    }
    df["financial_stress_score"] = (
        pd.DataFrame(stress_components).sum(axis=1).clip(0, 100)
    )
    df["stress_level"] = pd.cut(
        df["financial_stress_score"],
        bins=[0, 40, 70, 100],
        labels=["Low", "Medium", "High"],
        include_lowest=True,
    )
    return df


def train_from_dataset(dataset_dir: Path) -> dict:
    transactions, user_profiles = _load_dataset(dataset_dir)
    feature_df = _build_global_feature_df(transactions, user_profiles)

    if feature_df.empty:
        raise ValueError("No features could be engineered from dataset")

    X_anomaly = feature_df[ANOMALY_FEATURES].fillna(0)
    anomaly_scaler = StandardScaler()
    X_anomaly_scaled = anomaly_scaler.fit_transform(X_anomaly)

    anomaly_model = IsolationForest(contamination=0.05, random_state=42)
    feature_df["anomaly_score"] = anomaly_model.fit_predict(X_anomaly_scaled)
    feature_df["is_anomaly"] = feature_df["anomaly_score"] == -1

    feature_df = _apply_stress_scores(feature_df)

    user_agg = (
        feature_df.groupby("user_id")
        .agg(
            {
                "amount": "mean",
                "is_weekend": "mean",
                "budget_utilization": "mean",
                "impulsive_score": "mean",
                "subscription_burden": "sum",
            }
        )
        .reset_index()
    )

    X_cluster = user_agg[CLUSTER_AGG_FEATURES].fillna(0)
    cluster_scaler = StandardScaler()
    X_cluster_scaled = cluster_scaler.fit_transform(X_cluster)

    kmeans_model = KMeans(n_clusters=5, random_state=42, n_init=10)
    user_agg["cluster"] = kmeans_model.fit_predict(X_cluster_scaled)

    category_totals = (
        feature_df.groupby("category")["amount"].sum().sort_values(ascending=False)
    )

    return {
        "version": "1.0",
        "sklearn_version": sklearn.__version__,
        "anomaly_model": anomaly_model,
        "anomaly_scaler": anomaly_scaler,
        "anomaly_features": ANOMALY_FEATURES,
        "kmeans_model": kmeans_model,
        "cluster_scaler": cluster_scaler,
        "cluster_features": CLUSTER_AGG_FEATURES,
        "cluster_labels": CLUSTER_LABELS,
        "category_reference": category_totals.to_dict(),
        "training_rows": len(feature_df),
        "training_users": feature_df["user_id"].nunique(),
    }


def save_models(bundle: dict, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, output_path)
    return output_path


if __name__ == "__main__":
    import sklearn

    out = Path(__file__).resolve().parent.parent.parent / "model" / "student_financial_intelligence_models.pkl"
    bundle = train_from_dataset(DATASET_DIR)
    bundle["sklearn_version"] = sklearn.__version__
    save_models(bundle, out)
    print(f"Saved {out} ({bundle['training_rows']} rows, sklearn {sklearn.__version__})")
