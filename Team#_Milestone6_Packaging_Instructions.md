# Team # Milestone 6 Packaging Instructions

Use this checklist before submitting the project source files.

## Recommended Submission Files

Submit:

- `Team#_Milestone6_Summary_Access.md`
- A zip file named `Team#_CodeTrace_Source.zip`

Replace `#` with your actual team number.

## Before Zipping

Make sure these private or generated files are not included:

- `.git/`
- `.env`
- `backend/.env`
- `.venv/`
- `backend/venv/`
- `frontend/node_modules/`
- `frontend/dist/`
- `__pycache__/`
- `.pytest_cache/`
- any database files such as `*.db`

## Safest Zip Command

First commit your final source files. Then run this command from the repository root:

```powershell
git archive --format=zip --output ..\Team#_CodeTrace_Source.zip HEAD
```

This is safer than manually zipping folders because it only includes files tracked by Git.

After creating the zip, open it once and confirm it contains the project source files and does not contain `node_modules`, `venv`, `.venv`, `.git`, or `.env`.
