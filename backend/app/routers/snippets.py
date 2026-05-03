from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import ai_snippet, crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/snippets", tags=["snippets"])

@router.get("/custom", response_model=schemas.SnippetOut)
def generate_custom_snippet(
    difficulty: str = "Beginner",
    language: str = "Python",
    topic: str | None = None,
    exclude_id: int | None = None,
    db: Session = Depends(get_db),
    # current_user=Depends(auth.get_current_user),
):
    difficulty_title = difficulty.title()
    language_title = language.title()
    generated = ai_snippet.generate_ai_snippet(difficulty_title, language_title, topic)
    if generated and all(k in generated for k in ("code_text", "expected_output", "explanation")):
        snippet = crud.create_snippet(
            db,
            difficulty_level=difficulty_title,
            code_text=generated["code_text"],
            expected_output=generated["expected_output"],
            explanation=generated["explanation"],
            last_asked_at=datetime.now(timezone.utc),
        )
        return snippet

    snippet = crud.get_random_safe_snippet(db, difficulty_title, exclude_snippet_id=exclude_id)
    if not snippet and exclude_id is not None:
        snippet = crud.get_random_safe_snippet(db, difficulty_title, exclude_snippet_id=None)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    crud.mark_snippet_asked(db, snippet)
    return snippet

@router.get("/generate/{difficulty}", response_model=schemas.SnippetOut)
def generate_snippet(
    difficulty: str,
    exclude_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    difficulty_title = difficulty.title()
    generated = ai_snippet.generate_ai_snippet(difficulty_title)
    if generated and all(k in generated for k in ("code_text", "expected_output", "explanation")):
        snippet = crud.create_snippet(
            db,
            difficulty_level=difficulty_title,
            code_text=generated["code_text"],
            expected_output=generated["expected_output"],
            explanation=generated["explanation"],
            last_asked_at=datetime.now(timezone.utc),
        )
        return snippet

    snippet = crud.get_random_safe_snippet(db, difficulty_title, exclude_snippet_id=exclude_id)
    if not snippet and exclude_id is not None:
        snippet = crud.get_random_safe_snippet(db, difficulty_title, exclude_snippet_id=None)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    crud.mark_snippet_asked(db, snippet)
    return snippet

@router.get("/{difficulty}", response_model=schemas.SnippetOut)
def read_snippet(difficulty: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    snippet = crud.get_random_safe_snippet(db, difficulty.title())
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    crud.mark_snippet_asked(db, snippet)
    return snippet


@router.get("/{snippet_id}/assistant", response_model=schemas.AssistantResponse)
def snippet_assistant(
    snippet_id: int,
    mode: str = "explain",
    user_answer: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    snippet = crud.get_snippet(db, snippet_id)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    message = ai_snippet.generate_ai_assistant_response(
        snippet.code_text,
        snippet.expected_output,
        mode,
        user_answer,
    )
    return {"message": message}
