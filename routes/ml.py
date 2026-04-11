from __future__ import annotations

from fastapi import APIRouter, Depends
from pymongo.collection import Collection

from database import get_complaints_collection
from models import MLInsightsResponse
from services.ml import build_ml_insights
from utils.auth import require_admin_password


router = APIRouter(tags=["ml"], dependencies=[Depends(require_admin_password)])


@router.get("/ml-insights", response_model=MLInsightsResponse)
def get_ml_insights(
    collection: Collection = Depends(get_complaints_collection),
) -> MLInsightsResponse:
    return build_ml_insights(collection)
