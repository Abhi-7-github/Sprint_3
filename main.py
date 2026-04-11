from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from routes.complaints import insights_router, router as complaints_router
from routes.ml import router as ml_router


# Load environment variables from .env if present
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger("municipal-grievances")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle.

    - Establish Mongo client
    - Ensure indexes used for deduplication
    - Close Mongo client on shutdown
    """

    database.connect_mongo()
    collection = database.get_complaints_collection()

    # Unique index enforces duplicate rule: same normalizedDescription + same wardKey
    collection.create_index(
        [("normalizedDescription", 1), ("wardKey", 1)],
        name="uq_description_ward",
        unique=True,
    )

    logger.info("MongoDB connected and indexes ensured")
    try:
        yield
    finally:
        database.close_mongo()
        logger.info("MongoDB connection closed")


app = FastAPI(
    title="Municipal Grievance Data Pipeline API",
    version="1.0.0",
    lifespan=lifespan,
)

# Dev-friendly CORS for local React frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints_router)
app.include_router(insights_router)
app.include_router(ml_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
