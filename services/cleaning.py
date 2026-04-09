from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional


_CATEGORY_KEYWORDS = {
    "water": ("water", "leak", "pipeline", "sewage", "drain"),
    "garbage": ("garbage", "trash", "waste", "litter"),
    "road": ("road", "pothole", "street", "footpath"),
    "electricity": ("electricity", "power", "light", "streetlight", "outage"),
    "cleanliness": ("cleanliness", "sanitation", "hygiene", "filth"),
    "other": ()
}


_whitespace_re = re.compile(r"\s+")


def normalize_description(description: str) -> str:
    """Lowercase + trim + collapse whitespace for stable comparisons."""

    normalized = description.strip().lower()
    normalized = _whitespace_re.sub(" ", normalized)
    return normalized


def detect_category(normalized_description: str) -> str:
    """Detect category based on simple keyword matching."""

    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(keyword in normalized_description for keyword in keywords):
            return category
    return ""


def normalize_ward(ward: Optional[str]) -> str:
    if not ward:
        return ""
    return _whitespace_re.sub(" ", ward.strip().lower())


@dataclass(frozen=True)
class CleanedComplaint:
    normalized_description: str
    category: str
    ward_key: str


def clean_complaint(
    *,
    description: str,
    category: Optional[str],
    ward: Optional[str],
    area: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
) -> CleanedComplaint:
    normalized = normalize_description(description)
    auto_category = detect_category(normalized)

    # Dedup rule: same normalized description + same ward
    ward_key = normalize_ward(ward)

    # If user provided a category, keep it if non-empty; otherwise use auto.
    chosen_category = (category or "").strip().lower()
    if not chosen_category:
        chosen_category = auto_category

    # Enforce allowed categories. If auto-detection fails and no hint was provided,
    # default to "road" rather than returning an unsupported category.
    if chosen_category not in _CATEGORY_KEYWORDS:
        chosen_category = "road"

    return CleanedComplaint(
        normalized_description=normalized,
        category=chosen_category,
        ward_key=ward_key,
    )
