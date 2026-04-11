from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field


class PyObjectId(ObjectId):
    """Pydantic-compatible ObjectId wrapper."""

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema: Any, handler: Any) -> Dict[str, Any]:
        schema = handler(core_schema)
        schema.update(type="string")
        return schema

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: Any) -> Any:
        # Accept ObjectId or string
        from pydantic_core import core_schema

        def validate(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str) and ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")

        return core_schema.no_info_plain_validator_function(validate)


class ComplaintStatus(str, Enum):
    pending = "pending"
    in_progress = "in-progress"
    resolved = "resolved"


class ComplaintPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ComplaintCategory(str, Enum):
    water = "water"
    garbage = "garbage"
    road = "road"
    electricity = "electricity"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ComplaintBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(..., min_length=1, description="Grievance description")
    category: ComplaintCategory = Field(..., description="Auto-detected category")
    ward: Optional[str] = Field(default=None)
    area: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    status: ComplaintStatus = Field(default=ComplaintStatus.pending)
    priority: ComplaintPriority = Field(default=ComplaintPriority.low)


class ComplaintCreate(BaseModel):
    """Payload for POST /complaints (public)."""

    model_config = ConfigDict(extra="ignore")

    description: str = Field(..., min_length=1)
    ward: Optional[str] = Field(default=None)
    area: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)

    # Optional hint if auto-detection fails; server still normalizes/validates.
    category: Optional[ComplaintCategory] = Field(default=None)


class ComplaintStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ComplaintStatus


class ComplaintInDB(ComplaintBase):
    """Shape stored in MongoDB (includes internal fields)."""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    createdAt: datetime = Field(default_factory=utc_now)

    # Internal fields used for deduplication / normalization
    normalizedDescription: str
    wardKey: str


class ComplaintPublic(ComplaintBase):
    """API response shape."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="MongoDB document id")
    createdAt: datetime


class TopRecurringIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    count: int


class InsightsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    totalComplaints: int
    mostCommonCategory: Optional[str] = None
    mostAffectedWard: Optional[str] = None
    countsByCategory: Dict[str, int]
    countsByWard: Dict[str, int]
    topRecurringIssues: List[TopRecurringIssue]


class MLCluster(BaseModel):
    model_config = ConfigDict(extra="forbid")

    issue: str
    count: int
    wards: List[str]


class MLPredictedCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    predicted: str
    actual: Optional[str] = None
    confidence: Optional[float] = None


class MLInsightsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clusters: List[MLCluster]
    predictedCategories: List[MLPredictedCategory]
    message: Optional[str] = None
