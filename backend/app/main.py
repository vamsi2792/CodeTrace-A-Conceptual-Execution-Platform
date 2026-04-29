from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import auth, snippets, attempts, users

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeTrace Educational Platform API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(snippets.router)
app.include_router(attempts.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "CodeTrace API is running"}
