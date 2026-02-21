# ── MongoDB Service ──────────────────────────────────
# Connects to MongoDB Atlas using pymongo.

import os
from pymongo import MongoClient
from typing import Optional

client: Optional[MongoClient] = None
db = None


def connect_db():
    """
    Connect to MongoDB Atlas.
    Uses MONGO_URI from .env (a standard Atlas connection string).
    """
    global client, db
    
    uri = os.getenv("MONGO_URI")
    if not uri:
        raise ValueError("MONGO_URI is not set in .env — add your Atlas connection string.")

    db_name = os.getenv("MONGO_DB", "recall")

    print(f"[mongo] Connecting to Atlas (database: {db_name})…")
    client = MongoClient(uri)
    
    # Verify connection
    client.admin.command("ping")
    print("[mongo] Connected to MongoDB Atlas ✓")

    db = client[db_name]
    return db


def get_db():
    """
    Get the current database instance.
    """
    global db
    if db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return db


def close_db():
    """
    Close the MongoDB connection gracefully.
    """
    global client, db
    if client:
        client.close()
        print("[mongo] Connection closed.")
        client = None
        db = None
