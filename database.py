from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database


@dataclass(frozen=True)
class MongoSettings:
    """Mongo configuration loaded from environment variables."""

    uri: str
    db_name: str
    collection_name: str


def get_settings() -> MongoSettings:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is not set. Create a .env file (see .env.example) or set the env var."
        )

    db_name = os.getenv("MONGODB_DB", "municipal_grievances")
    collection_name = os.getenv("MONGODB_COLLECTION", "complaints")
    return MongoSettings(uri=uri, db_name=db_name, collection_name=collection_name)


_client: Optional[MongoClient] = None


def connect_mongo() -> MongoClient:
    """Create (or return) a singleton MongoClient.

    PyMongo's MongoClient is thread-safe and intended to be long-lived.
    """

    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(settings.uri)
    return _client


def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> Database:
    client = connect_mongo()
    settings = get_settings()
    return client[settings.db_name]


def get_complaints_collection() -> Collection:
    db = get_database()
    settings = get_settings()
    return db[settings.collection_name]
