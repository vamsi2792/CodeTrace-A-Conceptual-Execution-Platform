# CodeTrace Deployment Guide

Recommended production setup:

- Backend API and PostgreSQL database on Render.
- Frontend React app on Vercel.

This keeps the FastAPI service and database on a backend platform, while Vercel serves the Vite app globally.

## 1. Deploy Backend and Database on Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect this repository.
4. Render will detect `render.yaml` at the repository root.
5. During Blueprint setup, enter:
   - `OPENAI_API_KEY`: your OpenAI API key, or leave blank if you only want seeded snippets.
   - `CORS_ORIGINS`: initially use `http://localhost:3000`; after deploying the frontend, replace this with your Vercel URL.
6. Deploy the Blueprint.
7. Copy the backend public URL. It will look like:

```text
https://codetrace-backend.onrender.com
```

## 2. Deploy Frontend on Vercel

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to:

```text
frontend
```

3. Vercel should detect Vite. If needed, use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add this environment variable in Vercel:

```text
VITE_API_URL=https://your-render-backend-url.onrender.com
```

5. Deploy the frontend.
6. Copy the Vercel production URL. It will look like:

```text
https://your-project.vercel.app
```

## 3. Update Backend CORS

Go back to the Render backend service environment variables and set:

```text
CORS_ORIGINS=https://your-project.vercel.app
```

Then redeploy the Render backend.

For local Docker testing, this repo still uses:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`

## Important Security Note

Do not commit `.env` files or API keys. Rotate any key that has been pasted into a local file before using the deployed app.
