# CodeTrace-A-Conceptual-Execution-Platform

This repository contains a full-stack Code Reading Educational Platform built with FastAPI, PostgreSQL, and a React + Vite frontend styled with Tailwind CSS.

## Project Structure

- `backend/`: FastAPI backend service, SQLAlchemy models, Alembic migrations, authentication, snippet endpoints.
- `frontend/`: React + Vite frontend application styled with Tailwind CSS.

## Backend Setup

1. Create a Python virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Configure your database connection with `DATABASE_URL`:
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost/code_trace_db"
   export SECRET_KEY="your-secret-key"
   ```

3. Create the database if needed and run migrations:
   ```bash
   createdb code_trace_db
   alembic upgrade head
   ```

4. Seed starter snippets:
   ```bash
   python -m app.seed
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. Install Node dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the frontend dev server:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

3. Open `http://localhost:5173` in your browser.

## Notes

- The frontend expects the backend at `http://localhost:8000` by default.
- You can override the backend URL using `VITE_API_URL` in `frontend/.env`.
