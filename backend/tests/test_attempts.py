"""Tests for /api/attempts endpoints (submit, history)."""

from tests.conftest import register_user, auth_headers


def _get_snippet_id(client, token, difficulty="Beginner"):
    resp = client.get(f"/api/snippets/{difficulty}", headers=auth_headers(token))
    assert resp.status_code == 200
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# POST /api/attempts
# ---------------------------------------------------------------------------

def test_submit_without_auth_returns_401(client):
    resp = client.post("/api/attempts", json={"snippet_id": 1, "user_answer": "0\n1\n2"})
    assert resp.status_code == 401


def test_submit_correct_answer_returns_is_correct_true(client):
    token = register_user(client)
    snippet_id = _get_snippet_id(client, token)
    # The seeded Beginner snippet output is "0\n1\n2"
    resp = client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_correct"] is True
    assert "expected_output" in body
    assert "explanation" in body
    assert "user_answer" in body


def test_submit_wrong_answer_returns_is_correct_false(client):
    token = register_user(client)
    snippet_id = _get_snippet_id(client, token)
    resp = client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "wrong answer"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["is_correct"] is False


def test_submit_invalid_snippet_id_returns_404(client):
    token = register_user(client)
    resp = client.post(
        "/api/attempts",
        json={"snippet_id": 99999, "user_answer": "anything"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 404


def test_submit_response_contains_expected_output(client):
    token = register_user(client)
    snippet_id = _get_snippet_id(client, token)
    resp = client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token),
    )
    body = resp.json()
    assert body["expected_output"] == "0\n1\n2"


def test_submit_answer_normalises_trailing_whitespace(client):
    """Trailing spaces on each line should be ignored when grading."""
    token = register_user(client)
    snippet_id = _get_snippet_id(client, token)
    resp = client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0  \n1  \n2  "},
        headers=auth_headers(token),
    )
    assert resp.json()["is_correct"] is True


# ---------------------------------------------------------------------------
# GET /api/attempts/history
# ---------------------------------------------------------------------------

def test_history_without_auth_returns_401(client):
    resp = client.get("/api/attempts/history")
    assert resp.status_code == 401


def test_history_empty_before_any_attempts(client):
    token = register_user(client)
    resp = client.get("/api/attempts/history", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json() == []


def test_history_contains_attempt_after_submission(client):
    token = register_user(client)
    snippet_id = _get_snippet_id(client, token)
    client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token),
    )
    history = client.get("/api/attempts/history", headers=auth_headers(token)).json()
    assert len(history) == 1
    item = history[0]
    assert "attempt_id" in item
    assert "snippet_id" in item
    assert "difficulty_level" in item
    assert "is_correct" in item
    assert "attempted_at" in item


def test_history_is_user_scoped(client):
    """Two users should only see their own attempts."""
    token_a = register_user(client, username="userA", email="a@example.com")
    token_b = register_user(client, username="userB", email="b@example.com")

    snippet_id = _get_snippet_id(client, token_a)
    client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token_a),
    )

    history_b = client.get("/api/attempts/history", headers=auth_headers(token_b)).json()
    assert history_b == []
