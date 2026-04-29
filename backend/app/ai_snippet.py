import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

# Load backend/.env automatically so OPENAI_API_KEY works without
# exporting env vars in every terminal session.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _extract_json(content: str) -> dict | None:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError:
                return None
    return None


def generate_ai_snippet(difficulty: str) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    prompt = (
        f"Generate one Python code snippet for a {difficulty} difficulty programming exercise. "
        "Return ONLY a JSON object with keys: code_text, expected_output, explanation. "
        "code_text must be runnable Python code. expected_output must be exact console output. "
        "explanation should be concise and beginner-friendly."
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=300,
        )
        content = (response.choices[0].message.content or "").strip()
        parsed = _extract_json(content)
        if not parsed:
            return None
        required_keys = {"code_text", "expected_output", "explanation"}
        if not required_keys.issubset(parsed):
            return None
        return parsed
    except Exception:
        return None
