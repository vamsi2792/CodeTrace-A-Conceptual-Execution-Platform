import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import auth, snippets, attempts, users
from .seed import run as seed_database

# models.Base.metadata.create_all(bind=engine)
# seed_database()
try:
    models.Base.metadata.create_all(bind=engine)
    seed_database()
except Exception as e:
    print("DB not available, skipping init:", e)

app = FastAPI(title="CodeTrace Educational Platform API")

# ALLOWED_ORIGINS accepts a comma-separated list so the same image works in
# both local dev and Cloud Run without a rebuild.
# Example Cloud Run env var:
#   ALLOWED_ORIGINS=https://codetrace-frontend-282324739306.us-central1.run.app
_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(snippets.router)
app.include_router(attempts.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "CodeTrace API is running"}
