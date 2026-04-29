from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import ai_snippet, crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/snippets", tags=["snippets"])


@router.get("/{difficulty}", response_model=schemas.SnippetOut)
def read_snippet(difficulty: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    snippet = crud.get_random_snippet(db, difficulty.title())
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    return snippet


@router.get("/generate/{difficulty}", response_model=schemas.SnippetOut)
def generate_snippet(difficulty: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    difficulty_title = difficulty.title()
    generated = ai_snippet.generate_ai_snippet(difficulty_title)
    if generated and all(k in generated for k in ("code_text", "expected_output", "explanation")):
        snippet = crud.create_snippet(
            db,
            difficulty_level=difficulty_title,
            code_text=generated["code_text"],
            expected_output=generated["expected_output"],
            explanation=generated["explanation"],
        )
        return snippet

    snippet = crud.get_random_snippet(db, difficulty_title)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    return snippet
