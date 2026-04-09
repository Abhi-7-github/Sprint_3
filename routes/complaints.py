from __future__ import annotations

from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from pymongo import ReturnDocument

from database import get_complaints_collection
from models import (
    ComplaintCreate,
    ComplaintPublic,
    ComplaintStatusUpdate,
    InsightsResponse,
)
from services.cleaning import clean_complaint
from services.insights import build_insights
from utils.auth import require_admin_password


router = APIRouter(prefix="/complaints", tags=["complaints"])


def _to_public(doc: dict) -> ComplaintPublic:
    category = (doc.get("category") or "road").strip().lower()
    if category not in {"water", "garbage", "road", "electricity"}:
        category = "road"

    return ComplaintPublic(
        id=str(doc["_id"]),
        description=doc["description"],
        category=category,
        ward=doc.get("ward", ""),
        area=doc.get("area"),
        latitude=doc.get("latitude"),
        longitude=doc.get("longitude"),
        status=doc.get("status", "pending"),
        priority=doc.get("priority", "low"),
        createdAt=doc["createdAt"],
    )


def _parse_object_id(id: str) -> ObjectId:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid complaint id")
    return ObjectId(id)


@router.post("", response_model=ComplaintPublic, status_code=status.HTTP_201_CREATED)
def add_complaint(
    payload: ComplaintCreate,
    response: Response,
    collection: Collection = Depends(get_complaints_collection),
) -> ComplaintPublic:
    cleaned = clean_complaint(
        description=payload.description,
        category=payload.category.value if payload.category else None,
        ward=payload.ward,
        area=payload.area,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )

    doc = {
        "description": cleaned.normalized_description,
        "category": cleaned.category,
        "ward": payload.ward.strip() if payload.ward else None,
        "area": payload.area,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "status": "pending",
        "priority": "low",
    }
    doc["normalizedDescription"] = cleaned.normalized_description
    doc["wardKey"] = cleaned.ward_key

    # createdAt is set server-side to avoid client clock skew
    from datetime import datetime, timezone

    doc["createdAt"] = datetime.now(timezone.utc)

    try:
        result = collection.insert_one(doc)
    except DuplicateKeyError:
        existing = collection.find_one(
            {
                "normalizedDescription": cleaned.normalized_description,
                "wardKey": cleaned.ward_key,
            }
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate complaint detected (same description and ward).",
            )
        response.status_code = status.HTTP_200_OK
        return _to_public(existing)

    created = collection.find_one({"_id": result.inserted_id})
    return _to_public(created)


@router.get(
    "",
    response_model=List[ComplaintPublic],
    dependencies=[Depends(require_admin_password)],
)
def get_all_complaints(
    collection: Collection = Depends(get_complaints_collection),
) -> List[ComplaintPublic]:
    docs = list(collection.find().sort("createdAt", -1))
    return [_to_public(d) for d in docs]


@router.get("/{id}", response_model=ComplaintPublic)
def get_complaint(
    id: str,
    collection: Collection = Depends(get_complaints_collection),
) -> ComplaintPublic:
    oid = _parse_object_id(id)
    doc = collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _to_public(doc)


@router.put(
    "/{id}",
    response_model=ComplaintPublic,
    dependencies=[Depends(require_admin_password)],
)
def update_status(
    id: str,
    payload: ComplaintStatusUpdate,
    collection: Collection = Depends(get_complaints_collection),
) -> ComplaintPublic:
    oid = _parse_object_id(id)

    updated = collection.find_one_and_update(
        {"_id": oid},
        {"$set": {"status": payload.status.value}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _to_public(updated)


insights_router = APIRouter(tags=["insights"])


@insights_router.get(
    "/insights",
    response_model=InsightsResponse,
    dependencies=[Depends(require_admin_password)],
)
def get_insights(collection: Collection = Depends(get_complaints_collection)) -> InsightsResponse:
    return build_insights(collection)
