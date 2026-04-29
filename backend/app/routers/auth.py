from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = crud.create_user(db, user, hashed_password)
    crud.create_user_stats(db, new_user.id)
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.email)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
