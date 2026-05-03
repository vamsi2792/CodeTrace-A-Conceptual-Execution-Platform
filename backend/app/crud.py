from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text

from . import models, schemas


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_user_stats(db: Session, user_id: int):
    stats = models.UserStat(user_id=user_id, snippets_solved=0, current_streak=0, accuracy_percentage=0)
    db.add(stats)
    db.commit()
    db.refresh(stats)
    return stats


def get_user_stats(db: Session, user_id: int):
    return db.query(models.UserStat).filter(models.UserStat.user_id == user_id).first()


REPEAT_SNIPPET_COOLDOWN_SECONDS = 1800  # 30 minutes


def get_random_snippet(db: Session, difficulty: str, exclude_snippet_id: int | None = None):
    query = db.query(models.Snippet).filter(models.Snippet.difficulty_level == difficulty)
    if exclude_snippet_id is not None:
        query = query.filter(models.Snippet.id != exclude_snippet_id)
    snippet = query.order_by(func.random()).first()
    if snippet:
        return snippet
    # Fallback: if filtering excludes all rows for this difficulty,
    # return any snippet in the same difficulty.
    return (
        db.query(models.Snippet)
        .filter(models.Snippet.difficulty_level == difficulty)
        .order_by(func.random())
        .first()
    )


def get_random_unasked_snippet(db: Session, difficulty: str, exclude_snippet_id: int | None = None, cooldown_seconds: int = REPEAT_SNIPPET_COOLDOWN_SECONDS):
    cutoff = func.now() - text(f"interval '{cooldown_seconds} seconds'")
    query = db.query(models.Snippet).filter(models.Snippet.difficulty_level == difficulty)
    if exclude_snippet_id is not None:
        query = query.filter(models.Snippet.id != exclude_snippet_id)
    query = query.filter(
        or_(
            models.Snippet.last_asked_at == None,
            models.Snippet.last_asked_at < cutoff,
        )
    )
    return query.order_by(func.random()).first()


def mark_snippet_asked(db: Session, snippet: models.Snippet):
    snippet.last_asked_at = datetime.now(timezone.utc)
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return snippet


def is_deterministic_code(code_text: str) -> bool:
    normalized = code_text.lower()
    forbidden_tokens = ["input(", "raw_input(", "sys.stdin", "sys.argv", "getpass(", "prompt("]
    return not any(token in normalized for token in forbidden_tokens)


def get_random_safe_snippet(db: Session, difficulty: str, exclude_snippet_id: int | None = None, attempts: int = 8):
    # Prefer snippets that have not been asked recently.
    for _ in range(attempts):
        snippet = get_random_unasked_snippet(db, difficulty, exclude_snippet_id)
        if snippet is None:
            break
        if is_deterministic_code(snippet.code_text):
            return snippet
    # If all snippets were recently used or not deterministic, fall back to any safe snippet.
    for _ in range(attempts):
        snippet = get_random_snippet(db, difficulty, exclude_snippet_id)
        if snippet is None:
            break
        if is_deterministic_code(snippet.code_text):
            return snippet
    return get_random_snippet(db, difficulty, exclude_snippet_id)


def get_snippet(db: Session, snippet_id: int):
    return db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()


def create_snippet(db: Session, difficulty_level: str, code_text: str, expected_output: str, explanation: str, last_asked_at=None):
    snippet = models.Snippet(
        difficulty_level=difficulty_level,
        code_text=code_text,
        expected_output=expected_output,
        explanation=explanation,
        last_asked_at=last_asked_at,
    )
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return snippet


def create_attempt(db: Session, user_id: int, snippet_id: int, user_answer: str, is_correct: bool):
    attempt = models.Attempt(
        user_id=user_id,
        snippet_id=snippet_id,
        user_answer=user_answer,
        is_correct=is_correct,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_attempt_history(db: Session, user_id: int, limit: int = 30):
    rows = (
        db.query(models.Attempt, models.Snippet)
        .join(models.Snippet, models.Attempt.snippet_id == models.Snippet.id)
        .filter(models.Attempt.user_id == user_id)
        .order_by(models.Attempt.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "attempt_id": attempt.id,
            "snippet_id": snippet.id,
            "difficulty_level": snippet.difficulty_level,
            "code_text": snippet.code_text,
            "expected_output": snippet.expected_output,
            "user_answer": attempt.user_answer,
            "is_correct": attempt.is_correct,
            "attempted_at": attempt.timestamp,
        }
        for attempt, snippet in rows
    ]


def normalize_output(value: str) -> str:
    lines = [line.rstrip() for line in value.strip().splitlines()]
    return "\n".join(lines)


def update_user_stats(db: Session, user_id: int, is_correct: bool):
    stats = get_user_stats(db, user_id)
    if not stats:
        stats = create_user_stats(db, user_id)
    if is_correct:
        stats.current_streak += 1
    else:
        stats.current_streak = 0
    total_attempts = db.query(models.Attempt).filter(models.Attempt.user_id == user_id).count()
    correct_attempts = db.query(models.Attempt).filter(models.Attempt.user_id == user_id, models.Attempt.is_correct.is_(True)).count()
    stats.snippets_solved = correct_attempts
    stats.accuracy_percentage = round((correct_attempts / total_attempts) * 100) if total_attempts else 0
    db.add(stats)
    db.commit()
    db.refresh(stats)
    return stats
