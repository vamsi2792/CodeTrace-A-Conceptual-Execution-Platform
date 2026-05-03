from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class SnippetOut(BaseModel):
    id: int
    difficulty_level: str
    code_text: str

    model_config = {"from_attributes": True}


class AttemptCreate(BaseModel):
    snippet_id: int
    user_answer: str


class AttemptResult(BaseModel):
    is_correct: bool
    expected_output: str
    user_answer: str
    explanation: str


class AssistantResponse(BaseModel):
    message: str


class UserStatsOut(BaseModel):
    username: str
    snippets_solved: int
    current_streak: int
    accuracy_percentage: int

    model_config = {"from_attributes": True}


class AttemptHistoryItem(BaseModel):
    attempt_id: int
    snippet_id: int
    difficulty_level: str
    code_text: str
    expected_output: str
    user_answer: str
    is_correct: bool
    attempted_at: datetime
