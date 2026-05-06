# Team # Milestone 6 Summary and Access Information

## 1. Project Summary

**Project name:** CodeTrace: A Conceptual Execution Platform

CodeTrace is a web-based educational platform that helps students practice reading code and predicting program output. Users can create an account, log in, choose a difficulty level, answer code-output challenges, view whether their answer is correct, and track practice statistics such as solved snippets, streak, and accuracy. The system also includes an AI-powered custom challenge feature where users can request coding exercises by language, topic, and difficulty, as well as AI tutor help for hints and explanations.

The project was implemented as a full-stack web application. The frontend uses **React**, **Vite**, and **Tailwind CSS**. The backend uses **Python**, **FastAPI**, **SQLAlchemy**, and **PostgreSQL**. Authentication is handled with JWT tokens. The frontend is deployed on **Vercel**, while the backend API and PostgreSQL database are deployed on **Render**.

AI is used in two ways. First, the application uses the **OpenAI API** to generate custom code-reading challenges and tutor explanations. Second, AI coding assistance was used during development to help debug, improve deployment configuration, and prepare project documentation.

## 2. Access Information

**Frontend application URL:**

https://code-trace-a-conceptual-execution-p.vercel.app

**Backend API URL:**

https://codetrace-backend-50fl.onrender.com

**How to use the software:**

1. Open the frontend application URL in a browser.
2. Register a new account, or use the test account below.
3. After logging in, view the dashboard with practice statistics.
4. Choose a difficulty level: Beginner, Intermediate, or Advanced.
5. Read the displayed code snippet and type the expected output.
6. Submit the answer to see whether it is correct and read the explanation.
7. Use the AI tutor buttons for hints or line-by-line explanations.
8. Use the custom challenge section to request a challenge by language, topic, and difficulty.

**Instructor test account:**

Email: `REPLACE_WITH_TEST_EMAIL`

Password: `REPLACE_WITH_TEST_PASSWORD`

If the test account is not used, the instructor can register a new account directly from the login page.

## 3. Source Files and Deployment

The submitted source package should include only this project repository, including:

- `backend/`
- `frontend/`
- `docker-compose.yml`
- `render.yaml`
- `DEPLOYMENT.md`
- `README.md`
- `.gitignore`
- this summary/access document

Do not include local dependency folders or private files such as:

- `.git/`
- `.env`
- `backend/.env`
- `frontend/node_modules/`
- `backend/venv/`
- `.venv/`
- `frontend/dist/`
- `__pycache__/`

Deployment scripts/configuration are included in the repository:

- `render.yaml` for Render backend and PostgreSQL deployment.
- `frontend/vercel.json` for Vercel frontend deployment.
- `docker-compose.yml` for local full-stack Docker deployment.

