"""Tests for /api/users endpoints."""

from tests.conftest import register_user, auth_headers


def test_get_stats_without_auth_returns_401(client):
    resp = client.get("/api/users/me/stats")
    assert resp.status_code == 401


def test_get_stats_returns_expected_shape(client):
    token = register_user(client, username="statuser")
    resp = client.get("/api/users/me/stats", headers=auth_headers(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "statuser"
    assert body["snippets_solved"] == 0
    assert body["current_streak"] == 0
    assert body["accuracy_percentage"] == 0


def test_stats_update_after_correct_attempt(client):
    token = register_user(client)

    # Fetch a snippet and submit the correct answer.
    snippet_resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    snippet_id = snippet_resp.json()["id"]
    client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token),
    )

    stats = client.get("/api/users/me/stats", headers=auth_headers(token)).json()
    assert stats["snippets_solved"] == 1
    assert stats["current_streak"] == 1
    assert stats["accuracy_percentage"] == 100


def test_stats_streak_resets_after_wrong_attempt(client):
    token = register_user(client)
    snippet_resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    snippet_id = snippet_resp.json()["id"]

    # First attempt correct → streak = 1
    client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"},
        headers=auth_headers(token),
    )
    # Second attempt wrong → streak = 0
    client.post(
        "/api/attempts",
        json={"snippet_id": snippet_id, "user_answer": "wrong"},
        headers=auth_headers(token),
    )

    stats = client.get("/api/users/me/stats", headers=auth_headers(token)).json()
    assert stats["current_streak"] == 0
    assert stats["accuracy_percentage"] == 50


def test_stats_accuracy_calculated_correctly(client):
    token = register_user(client)
    snippet_resp = client.get("/api/snippets/Beginner", headers=auth_headers(token))
    snippet_id = snippet_resp.json()["id"]

    client.post("/api/attempts", json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"}, headers=auth_headers(token))
    client.post("/api/attempts", json={"snippet_id": snippet_id, "user_answer": "0\n1\n2"}, headers=auth_headers(token))
    client.post("/api/attempts", json={"snippet_id": snippet_id, "user_answer": "wrong"}, headers=auth_headers(token))

    stats = client.get("/api/users/me/stats", headers=auth_headers(token)).json()
    # 2 correct out of 3 → 67%
    assert stats["accuracy_percentage"] == 67
