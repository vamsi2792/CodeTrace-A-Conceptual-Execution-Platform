from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


def normalize_answer(value: str) -> str:
    return crud.normalize_output(value)


@router.post("", response_model=schemas.AttemptResult)
def submit_attempt(attempt: schemas.AttemptCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    snippet = crud.get_snippet(db, attempt.snippet_id)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    is_correct = normalize_answer(attempt.user_answer) == normalize_answer(snippet.expected_output)
    crud.create_attempt(db, current_user.id, attempt.snippet_id, attempt.user_answer, is_correct)
    crud.update_user_stats(db, current_user.id, is_correct)
    return {
        "is_correct": is_correct,
        "expected_output": snippet.expected_output,
        "user_answer": attempt.user_answer,
        "explanation": snippet.explanation,
    }
