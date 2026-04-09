from __future__ import annotations

from typing import Dict, List, Optional

from pymongo.collection import Collection

from models import InsightsResponse, TopRecurringIssue

def build_insights(collection: Collection, *, top_n: int = 5) -> InsightsResponse:
    """Compute analytics for the admin dashboard."""

    # Single round-trip aggregation, optimized for dashboard-style metrics.
    pipeline = [
        {
            "$facet": {
                "totals": [{"$count": "total"}],
                "byCategory": [
                    {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                ],
                "byWard": [
                    {"$group": {"_id": "$ward", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                ],
                "recurring": [
                    # Group by normalized description so trivial casing/whitespace differences merge.
                    {"$group": {"_id": "$normalizedDescription", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": int(top_n)},
                ],
            }
        }
    ]

    result = list(collection.aggregate(pipeline, allowDiskUse=True))
    facets = (result[0] if result else {}) or {}

    totals = facets.get("totals") or []
    total_complaints = int(totals[0]["total"]) if totals else 0

    by_category_rows = facets.get("byCategory") or []
    by_ward_rows = facets.get("byWard") or []
    recurring_rows = facets.get("recurring") or []

    counts_by_category: Dict[str, int] = {
        str(row.get("_id") or "unknown"): int(row.get("count", 0)) for row in by_category_rows
    }
    counts_by_ward: Dict[str, int] = {
        str(row.get("_id") or "unknown"): int(row.get("count", 0)) for row in by_ward_rows
    }

    most_common_category: Optional[str] = (
        str(by_category_rows[0].get("_id")) if by_category_rows and by_category_rows[0].get("_id") is not None else None
    )
    most_affected_ward: Optional[str] = (
        str(by_ward_rows[0].get("_id")) if by_ward_rows and by_ward_rows[0].get("_id") is not None else None
    )

    top_recurring: List[TopRecurringIssue] = [
        TopRecurringIssue(description=str(r.get("_id") or ""), count=int(r.get("count", 0)))
        for r in recurring_rows
        if int(r.get("count", 0)) > 0
    ]

    return InsightsResponse(
        totalComplaints=total_complaints,
        mostCommonCategory=most_common_category,
        mostAffectedWard=most_affected_ward,
        countsByCategory=counts_by_category,
        countsByWard=counts_by_ward,
        topRecurringIssues=top_recurring,
    )
