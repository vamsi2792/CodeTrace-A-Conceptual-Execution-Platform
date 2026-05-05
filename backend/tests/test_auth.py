"""Tests for /api/auth endpoints (register, login)."""

from tests.conftest import register_user, auth_headers


def test_register_returns_bearer_token(client):
    resp = client.post("/api/auth/register", json={
        "username": "alice",
        "email": "alice@example.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_register_duplicate_email_returns_400(client):
    payload = {"username": "bob", "email": "bob@example.com", "password": "pass123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400
    assert "Email already registered" in resp.json()["detail"]


def test_register_invalid_email_returns_422(client):
    resp = client.post("/api/auth/register", json={
        "username": "charlie",
        "email": "not-an-email",
        "password": "password123",
    })
    assert resp.status_code == 422


def test_register_missing_fields_returns_422(client):
    resp = client.post("/api/auth/register", json={"email": "incomplete@example.com"})
    assert resp.status_code == 422


def test_login_valid_credentials_returns_token(client):
    client.post("/api/auth/register", json={
        "username": "dave",
        "email": "dave@example.com",
        "password": "mypassword",
    })
    resp = client.post("/api/auth/login", json={
        "email": "dave@example.com",
        "password": "mypassword",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json={
        "username": "eve",
        "email": "eve@example.com",
        "password": "correctpassword",
    })
    resp = client.post("/api/auth/login", json={
        "email": "eve@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.json()["detail"]


def test_login_unknown_email_returns_401(client):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password123",
    })
    assert resp.status_code == 401


def test_token_allows_authenticated_request(client):
    """A token obtained from register should authenticate subsequent requests."""
    token = register_user(client, email="frank@example.com")
    resp = client.get("/api/users/me/stats", headers=auth_headers(token))
    assert resp.status_code == 200


def test_invalid_token_returns_401(client):
    resp = client.get("/api/users/me/stats", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401
