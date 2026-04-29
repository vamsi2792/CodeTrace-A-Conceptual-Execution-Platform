from sqlalchemy.orm import Session
from sqlalchemy import func

from . import models, schemas


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(email=user.email, hashed_password=hashed_password)
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


def get_random_snippet(db: Session, difficulty: str):
    return db.query(models.Snippet).filter(models.Snippet.difficulty_level == difficulty).order_by(func.random()).first()


def get_snippet(db: Session, snippet_id: int):
    return db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()


def create_snippet(db: Session, difficulty_level: str, code_text: str, expected_output: str, explanation: str):
    snippet = models.Snippet(
        difficulty_level=difficulty_level,
        code_text=code_text,
        expected_output=expected_output,
        explanation=explanation,
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
