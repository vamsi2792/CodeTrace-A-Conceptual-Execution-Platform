from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/stats", response_model=schemas.UserStatsOut)
def get_user_stats(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    stats = crud.get_user_stats(db, current_user.id)
    if not stats:
        stats = crud.create_user_stats(db, current_user.id)
    return {
        "username": current_user.username,
        "snippets_solved": stats.snippets_solved,
        "current_streak": stats.current_streak,
        "accuracy_percentage": stats.accuracy_percentage,
    }
