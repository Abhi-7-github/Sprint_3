from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Dict, List, Optional

import pandas as pd
from pymongo.collection import Collection
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from models import MLCluster, MLPredictedCategory, MLInsightsResponse


_ALLOWED_OUTPUT_CATEGORIES = {"water", "waste", "road", "electricity"}

_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s]+", re.IGNORECASE)
_WS_RE = re.compile(r"\s+")

# Polite/noise words that don't help as dashboard issue titles.
_NOISE_WORDS_RE = re.compile(
    r"\b(please|kindly|urgent|asap|request|requested|complaint|issue|problem|resolve|fix)\b",
    re.IGNORECASE,
)


def _normalize_category(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    cat = str(raw).strip().lower()
    if cat == "garbage":
        return "waste"
    if cat == "waste":
        return "waste"
    if cat in {"water", "road", "electricity"}:
        return cat
    return None


def _clean_text(text: object) -> str:
    """Normalize complaint text for display and modeling.

    - lowercase
    - remove punctuation/noise symbols
    - collapse whitespace

    We keep this explainable and consistent across clustering + classification.
    """

    raw = str(text or "").strip().lower()
    raw = _NON_ALNUM_RE.sub(" ", raw)
    raw = _WS_RE.sub(" ", raw).strip()
    return raw


def _is_meaningful_description(text: str) -> bool:
    if not text:
        return False
    if len(text) < 12:
        return False
    tokens = [t for t in text.split() if len(t) >= 3]
    return len(tokens) >= 3


def _issue_title(text: str, *, max_words: int = 8) -> str:
    cleaned = _NOISE_WORDS_RE.sub(" ", text)
    cleaned = _WS_RE.sub(" ", cleaned).strip()
    if not cleaned:
        cleaned = text

    words = cleaned.split()
    if len(words) > max_words:
        cleaned = " ".join(words[:max_words])
    return cleaned.strip() or "misc"


@dataclass
class _Cache:
    ts: float
    value: MLInsightsResponse


_cache: Optional[_Cache] = None


def build_ml_insights(
    collection: Collection,
    *,
    max_docs: int = 2000,
    # Backward-compatible knobs (no longer used; clustering is dynamic).
    n_clusters: Optional[int] = None,
    top_clusters: int = 5,
    top_terms: Optional[int] = None,
    top_wards: int = 5,
    predicted_sample_size: int = 50,
    cache_ttl_seconds: int = 300,
) -> MLInsightsResponse:
    """Detect recurring issues and predict categories from complaint text.

    - Recurring Issue Detection: TF-IDF + KMeans clusters
    - Category Prediction: TF-IDF + Logistic Regression

    Notes:
    - This trains in-memory from MongoDB each time (with a small TTL cache)
      to keep the implementation simple and explainable.
    """

    global _cache
    now = time.time()
    if _cache is not None and (now - _cache.ts) < float(cache_ttl_seconds):
        return _cache.value

    # Pull a bounded dataset (newest first) to keep latency predictable.
    cursor = (
        collection.find(
            {},
            projection={
                "description": 1,
                "category": 1,
                "ward": 1,
                "createdAt": 1,
            },
        )
        .sort("createdAt", -1)
        .limit(int(max_docs))
    )
    docs = list(cursor)

    if not docs:
        empty = MLInsightsResponse(clusters=[], predictedCategories=[], message="No complaints found.")
        _cache = _Cache(ts=now, value=empty)
        return empty

    rows: List[Dict[str, object]] = []
    for d in docs:
        rows.append(
            {
                "id": str(d.get("_id")),
                "description": _clean_text(d.get("description", "")),
                "category": _normalize_category(d.get("category")),
                "ward": str(d.get("ward") or "unknown").strip() or "unknown",
                "createdAt": d.get("createdAt"),
            }
        )

    df = pd.DataFrame(rows)
    df["description"] = df["description"].astype(str)
    df = df[df["description"].str.len() > 0]
    if df.empty:
        empty = MLInsightsResponse(clusters=[], predictedCategories=[], message="No usable complaint descriptions.")
        _cache = _Cache(ts=now, value=empty)
        return empty

    clusters: List[MLCluster] = []
    message: Optional[str] = None
    if len(df) < 5:
        message = "Dataset too small for clustering (need at least 5 complaints)."
    else:
        clusters = _build_clusters(df, top_clusters=top_clusters, top_wards=top_wards)

    predicted = _build_predictions(df, sample_size=predicted_sample_size)

    result = MLInsightsResponse(clusters=clusters, predictedCategories=predicted, message=message)
    _cache = _Cache(ts=now, value=result)
    return result


def _build_clusters(
    df: pd.DataFrame,
    *,
    top_clusters: int,
    top_wards: int,
) -> List[MLCluster]:
    n_docs = int(len(df))
    if n_docs < 5:
        return []

    descriptions = df["description"].astype(str).tolist()

    # Requested dynamic rule.
    k_start = min(5, n_docs // 2)
    if k_start < 2:
        return []

    vectorizer = TfidfVectorizer(
        stop_words="english",
        token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z]{2,}\b",  # drop very short tokens
        min_df=2 if n_docs >= 10 else 1,
        max_features=5000,
    )

    X = vectorizer.fit_transform(descriptions)
    if X.shape[0] < 5:
        return []

    # Try smaller k if we get too many tiny clusters.
    best_labels: Optional[List[int]] = None
    best_k = 0
    for k in range(int(k_start), 1, -1):
        kmeans = KMeans(n_clusters=int(k), random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        sizes = pd.Series(labels).value_counts()
        significant = int((sizes >= 2).sum())
        if significant >= 1:
            best_labels = labels.tolist()
            best_k = int(k)
            break

    if best_labels is None or best_k < 2:
        return []

    labels_series = pd.Series(best_labels, index=df.index, name="cluster")

    clusters: List[MLCluster] = []
    sizes = labels_series.value_counts().to_dict()

    for cluster_id, count in sorted(sizes.items(), key=lambda kv: kv[1], reverse=True):
        if int(count) < 2:
            continue

        subset = df[labels_series == int(cluster_id)]

        # Representative issue: most frequent (mode) complaint text in the cluster.
        issue_mode = subset["description"].astype(str).value_counts().idxmax()
        issue = _issue_title(str(issue_mode))

        # Wards: show ward keys in descending frequency.
        wards = (
            subset["ward"]
            .astype(str)
            .fillna("unknown")
            .replace({"": "unknown"})
            .value_counts()
            .head(int(top_wards))
            .index.tolist()
        )

        clusters.append(MLCluster(issue=issue, count=int(count), wards=[str(w) for w in wards]))

    return clusters[: int(top_clusters)]


def _build_predictions(df: pd.DataFrame, *, sample_size: int) -> List[MLPredictedCategory]:
    # Clean training data.
    train_df = df.dropna(subset=["category"]).copy()
    if train_df.empty:
        return []

    train_df["description"] = train_df["description"].astype(str)
    train_df = train_df[train_df["description"].map(_is_meaningful_description)]
    train_df = train_df[train_df["category"].isin(sorted(_ALLOWED_OUTPUT_CATEGORIES))]
    if train_df.empty:
        return []

    # Need at least 2 classes.
    if train_df["category"].nunique() < 2:
        return []

    # Balance classes when possible by downsampling to the smallest class.
    counts = train_df["category"].value_counts()
    min_count = int(counts.min()) if not counts.empty else 0
    if min_count >= 2:
        per_class = min(200, min_count)
        balanced_parts = []
        for cat in counts.index.tolist():
            part = train_df[train_df["category"] == cat].sample(n=per_class, random_state=42)
            balanced_parts.append(part)
        train_df = pd.concat(balanced_parts, ignore_index=True)

    pipeline: Pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    stop_words="english",
                    token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z]{2,}\b",
                    min_df=2 if len(train_df) >= 10 else 1,
                    max_features=5000,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    X_train = train_df["description"].astype(str).tolist()
    y_train = train_df["category"].astype(str).tolist()
    pipeline.fit(X_train, y_train)

    # Predict for the most recent meaningful complaints.
    sample_df = df.copy()
    sample_df["description"] = sample_df["description"].astype(str)
    sample_df = sample_df[sample_df["description"].map(_is_meaningful_description)].head(
        int(sample_size)
    )
    if sample_df.empty:
        return []

    sample_desc = sample_df["description"].tolist()
    preds = pipeline.predict(sample_desc)

    confidences: Optional[List[float]] = None
    if hasattr(pipeline, "predict_proba"):
        proba = pipeline.predict_proba(sample_desc)
        confidences = [float(p.max()) for p in proba]

    out: List[MLPredictedCategory] = []
    for i, (_, row) in enumerate(sample_df.iterrows()):
        pred_str = str(preds[i])
        if pred_str not in _ALLOWED_OUTPUT_CATEGORIES:
            continue
        conf = confidences[i] if confidences is not None else None
        out.append(
            MLPredictedCategory(
                description=str(row["description"]),
                predicted=pred_str,
                actual=row.get("category"),
                confidence=round(conf, 3) if conf is not None else None,
            )
        )

    return out
