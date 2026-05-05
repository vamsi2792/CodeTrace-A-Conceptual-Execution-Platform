"""
Pytest configuration for CodeTrace backend tests.

We inject a SQLite-backed stub for `app.database` into sys.modules before
any application code is imported.  This avoids:
  - connecting to a real PostgreSQL instance
  - executing the PostgreSQL-specific ALTER TABLE DDL in database.py
"""

import os
import sys
from types import ModuleType

# Must be set before any app code is imported.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_codetrace.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("OPENAI_API_KEY", "")  # keep OpenAI calls disabled

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# SQLite test engine
# ---------------------------------------------------------------------------
_TEST_DB = "sqlite:///./test_codetrace.db"
_test_engine = create_engine(_TEST_DB, connect_args={"check_same_thread": False})
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)
_Base = declarative_base()


def _get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Replace app.database with our stub so the real module never runs its
# PostgreSQL-specific startup code.
# ---------------------------------------------------------------------------
_stub = ModuleType("app.database")
_stub.engine = _test_engine
_stub.SessionLocal = _TestingSession
_stub.Base = _Base
_stub.get_db = _get_db
sys.modules["app.database"] = _stub

# Safe to import the application now.
from app.main import app  # noqa: E402
from app.database import Base, get_db  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clean_db():
    """Drop and recreate all tables, then re-seed, before every test."""
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    from app.seed import run as _seed
    _seed()
    yield


@pytest.fixture
def db():
    session = _TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def _override():
        session = _TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Shared test helpers (import these directly in test modules)
# ---------------------------------------------------------------------------


def register_user(client, username="testuser", email="test@example.com", password="password123"):
    """Register a user and return the JWT access token."""
    resp = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
    })
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
