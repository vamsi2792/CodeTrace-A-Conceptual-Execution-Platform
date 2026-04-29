from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class SnippetOut(BaseModel):
    id: int
    difficulty_level: str
    code_text: str

    class Config:
        orm_mode = True


class AttemptCreate(BaseModel):
    snippet_id: int
    user_answer: str


class AttemptResult(BaseModel):
    is_correct: bool
    expected_output: str
    user_answer: str
    explanation: str


class UserStatsOut(BaseModel):
    snippets_solved: int
    current_streak: int
    accuracy_percentage: int

    class Config:
        orm_mode = True
