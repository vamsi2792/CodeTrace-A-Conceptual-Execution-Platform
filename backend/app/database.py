import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost/code_trace_db"
)

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    conn.execute(
        text(
            "ALTER TABLE IF EXISTS snippets ADD COLUMN IF NOT EXISTS last_asked_at TIMESTAMP WITH TIME ZONE"
        )
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
