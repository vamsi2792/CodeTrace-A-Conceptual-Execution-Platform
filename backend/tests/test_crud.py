"""Unit tests for pure CRUD/utility functions that don't need HTTP."""

import pytest
from app.crud import normalize_output, is_deterministic_code, update_user_stats, create_user, create_user_stats
from app import schemas


# ---------------------------------------------------------------------------
# normalize_output
# ---------------------------------------------------------------------------

def test_normalize_strips_trailing_spaces_per_line():
    assert normalize_output("hello   \nworld   ") == "hello\nworld"


def test_normalize_strips_leading_and_trailing_blank_lines():
    assert normalize_output("\n\nhello\n\n") == "hello"


def test_normalize_preserves_internal_newlines():
    assert normalize_output("a\nb\nc") == "a\nb\nc"


def test_normalize_empty_string():
    assert normalize_output("") == ""


def test_normalize_single_line_no_whitespace():
    assert normalize_output("42") == "42"


def test_normalize_multiline_with_mixed_trailing_spaces():
    raw = "0  \n1\n2   "
    assert normalize_output(raw) == "0\n1\n2"


# ---------------------------------------------------------------------------
# is_deterministic_code
# ---------------------------------------------------------------------------

def test_deterministic_clean_code_returns_true():
    assert is_deterministic_code("x = 1\nprint(x)") is True


def test_input_call_returns_false():
    assert is_deterministic_code("x = input('Enter: ')") is False


def test_raw_input_returns_false():
    assert is_deterministic_code("x = raw_input('value: ')") is False


def test_sys_stdin_returns_false():
    assert is_deterministic_code("import sys\nline = sys.stdin.readline()") is False


def test_sys_argv_returns_false():
    assert is_deterministic_code("import sys\nprint(sys.argv[1])") is False


def test_getpass_returns_false():
    assert is_deterministic_code("import getpass\npw = getpass.getpass()") is False


def test_case_insensitive_check():
    assert is_deterministic_code("x = INPUT('value')") is False


# ---------------------------------------------------------------------------
# update_user_stats  (requires a real DB session via the db fixture)
# ---------------------------------------------------------------------------

def test_update_stats_increments_streak_on_correct(db):
    user_data = schemas.UserCreate(username="streakuser", email="streak@example.com", password="pw")
    user = create_user(db, user_data, "hashed_pw")
    create_user_stats(db, user.id)

    from app.crud import create_attempt, update_user_stats
    from app.models import Snippet

    snippet = Snippet(difficulty_level="Beginner", code_text="print(1)", expected_output="1", explanation="prints 1")
    db.add(snippet)
    db.commit()
    db.refresh(snippet)

    create_attempt(db, user.id, snippet.id, "1", is_correct=True)
    stats = update_user_stats(db, user.id, is_correct=True)
    assert stats.current_streak == 1
    assert stats.snippets_solved == 1
    assert stats.accuracy_percentage == 100


def test_update_stats_resets_streak_on_incorrect(db):
    user_data = schemas.UserCreate(username="resetuser", email="reset@example.com", password="pw")
    user = create_user(db, user_data, "hashed_pw")
    create_user_stats(db, user.id)

    from app.crud import create_attempt, update_user_stats
    from app.models import Snippet

    snippet = Snippet(difficulty_level="Beginner", code_text="print(2)", expected_output="2", explanation="prints 2")
    db.add(snippet)
    db.commit()
    db.refresh(snippet)

    # Correct then incorrect.
    create_attempt(db, user.id, snippet.id, "2", is_correct=True)
    update_user_stats(db, user.id, is_correct=True)
    create_attempt(db, user.id, snippet.id, "wrong", is_correct=False)
    stats = update_user_stats(db, user.id, is_correct=False)

    assert stats.current_streak == 0
    assert stats.snippets_solved == 1  # only the correct one counts
    assert stats.accuracy_percentage == 50


def test_update_stats_accuracy_rounds_correctly(db):
    user_data = schemas.UserCreate(username="accuser", email="acc@example.com", password="pw")
    user = create_user(db, user_data, "hashed_pw")
    create_user_stats(db, user.id)

    from app.crud import create_attempt, update_user_stats
    from app.models import Snippet

    snippet = Snippet(difficulty_level="Beginner", code_text="print(3)", expected_output="3", explanation="prints 3")
    db.add(snippet)
    db.commit()
    db.refresh(snippet)

    # 2 correct, 1 incorrect → 67%
    create_attempt(db, user.id, snippet.id, "3", is_correct=True)
    update_user_stats(db, user.id, is_correct=True)
    create_attempt(db, user.id, snippet.id, "3", is_correct=True)
    update_user_stats(db, user.id, is_correct=True)
    create_attempt(db, user.id, snippet.id, "x", is_correct=False)
    stats = update_user_stats(db, user.id, is_correct=False)

    assert stats.accuracy_percentage == 67
