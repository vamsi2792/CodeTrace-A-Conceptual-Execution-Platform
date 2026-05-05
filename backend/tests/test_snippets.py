"""Tests for /api/snippets endpoints."""

from tests.conftest import register_user, auth_headers


# ---------------------------------------------------------------------------
# GET /api/snippets/{difficulty}
# ---------------------------------------------------------------------------

def test_get_snippet_without_auth_returns_401(client):
    resp = client.get("/api/snippets/Beginner")
    assert resp.status_code == 401


def test_get_beginner_snippet_returns_200(client):
    token = register_user(client)
    resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    assert resp.status_code == 200


def test_get_intermediate_snippet_returns_200(client):
    token = register_user(client)
    resp = client.get("/api/snippets/Intermediate", headers=auth_headers(token))
    assert resp.status_code == 200


def test_get_advanced_snippet_returns_200(client):
    token = register_user(client)
    resp = client.get("/api/snippets/Advanced", headers=auth_headers(token))
    assert resp.status_code == 200


def test_snippet_response_has_required_fields(client):
    token = register_user(client)
    resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    body = resp.json()
    assert "id" in body
    assert "code_text" in body
    assert "difficulty_level" in body
    assert body["difficulty_level"] == "Beginner"


def test_snippet_response_does_not_expose_answer(client):
    """expected_output and explanation must not be in the snippet response."""
    token = register_user(client)
    resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    body = resp.json()
    assert "expected_output" not in body
    assert "explanation" not in body


def test_unknown_difficulty_returns_404(client):
    token = register_user(client)
    resp = client.get("/api/snippets/Expert", headers=auth_headers(token))
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/snippets/custom  (auth is intentionally disabled on this route)
# ---------------------------------------------------------------------------

def test_custom_endpoint_reachable_without_auth(client):
    """The /custom route is accessible without authentication.
    With no OpenAI key it falls back to a seeded snippet or 404."""
    resp = client.get("/api/snippets/custom?difficulty=Beginner&language=Python")
    assert resp.status_code in (200, 404)


def test_custom_endpoint_returns_snippet_shape_when_found(client):
    resp = client.get("/api/snippets/custom?difficulty=Beginner&language=Python")
    if resp.status_code == 200:
        body = resp.json()
        assert "id" in body
        assert "code_text" in body


# ---------------------------------------------------------------------------
# GET /api/snippets/generate/{difficulty}
# ---------------------------------------------------------------------------

def test_generate_without_auth_returns_401(client):
    resp = client.get("/api/snippets/generate/Beginner")
    assert resp.status_code == 401


def test_generate_with_auth_returns_snippet(client):
    token = register_user(client)
    resp = client.get("/api/snippets/generate/Beginner", headers=auth_headers(token))
    # No OpenAI key → falls back to seeded snippet
    assert resp.status_code in (200, 404)


# ---------------------------------------------------------------------------
# GET /api/snippets/{snippet_id}/assistant
# ---------------------------------------------------------------------------

def test_assistant_without_auth_returns_401(client):
    resp = client.get("/api/snippets/1/assistant?mode=explain")
    assert resp.status_code == 401


def test_assistant_unknown_snippet_returns_404(client):
    token = register_user(client)
    resp = client.get("/api/snippets/99999/assistant?mode=explain", headers=auth_headers(token))
    assert resp.status_code == 404


def test_assistant_explain_returns_fallback_message(client):
    """Without an OpenAI key the assistant returns a static fallback string."""
    token = register_user(client)
    snippet_resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    snippet_id = snippet_resp.json()["id"]

    resp = client.get(
        f"/api/snippets/{snippet_id}/assistant?mode=explain",
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert "message" in resp.json()
    assert len(resp.json()["message"]) > 0


def test_assistant_hint_returns_fallback_message(client):
    token = register_user(client)
    snippet_resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    snippet_id = snippet_resp.json()["id"]

    resp = client.get(
        f"/api/snippets/{snippet_id}/assistant?mode=hint",
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert "message" in resp.json()
