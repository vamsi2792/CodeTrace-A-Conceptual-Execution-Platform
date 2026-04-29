from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/snippets", tags=["snippets"])


@router.get("/{difficulty}", response_model=schemas.SnippetOut)
def read_snippet(difficulty: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    snippet = crud.get_random_snippet(db, difficulty.title())
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found for this difficulty")
    return snippet
