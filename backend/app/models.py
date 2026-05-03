from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    stats = relationship("UserStat", uselist=False, back_populates="user")
    attempts = relationship("Attempt", back_populates="user")


class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(Integer, primary_key=True, index=True)
    difficulty_level = Column(String, nullable=False)
    code_text = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    last_asked_at = Column(DateTime(timezone=True), nullable=True)

    attempts = relationship("Attempt", back_populates="snippet")


class UserStat(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    snippets_solved = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    accuracy_percentage = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="stats")


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    snippet_id = Column(Integer, ForeignKey("snippets.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="attempts")
    snippet = relationship("Snippet", back_populates="attempts")
