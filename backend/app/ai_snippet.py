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


def is_deterministic_code(code_text: str) -> bool:
    normalized = code_text.lower()
    forbidden_tokens = [
        "input(",
        "raw_input(",
        "sys.stdin",
        "sys.argv",
        "getpass(",
        "prompt(",
        "readline(",
        "console.read",
        "console.readline",
        "gets(",
        "scanner.nextline(",
        "scanner.next(",
        "scanner.nextint(",
        "cin>>",
    ]
    return not any(token in normalized for token in forbidden_tokens)


def generate_ai_snippet(difficulty: str, language: str = "Python", topic: str | None = None) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    prompt = (
        f"Generate one {language} code snippet for a {difficulty} difficulty programming exercise. "
        "Return ONLY a JSON object with keys: code_text, expected_output, explanation. "
        f"code_text must be runnable {language} code and must not require interactive input. "
        "Do not use input(), raw_input(), sys.stdin, sys.argv, getpass(), prompt(), console.read(), console.readline(), gets(), Scanner.nextLine(), Scanner.next(), Scanner.nextInt(), cin>> or any runtime user input. "
        "expected_output must be exact console output for the code as written. "
        "explanation should be concise and beginner-friendly."
    )
    if topic:
        prompt += f" Make the challenge about {topic}. "

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=400,
        )
        content = (response.choices[0].message.content or "").strip()
        parsed = _extract_json(content)
        if not parsed:
            return None
        required_keys = {"code_text", "expected_output", "explanation"}
        if not required_keys.issubset(parsed):
            return None
        if not is_deterministic_code(parsed["code_text"]):
            return None
        return parsed
    except Exception:
        return None


def generate_ai_assistant_response(code_text: str, expected_output: str, mode: str = "explain", user_answer: str | None = None) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        if mode == "hint":
            return "Try reading the code from top to bottom and identify how each variable changes before the final output."
        if mode == "why_wrong":
            return "Compare your answer with the expected output line by line, and check for spelling, whitespace, or missing values."
        return "Explain how each line contributes to the final output and why that result is produced."

    if mode == "hint":
        prompt = (
            "You are a coding tutor. Give a single helpful hint for this code snippet so the student can predict the output without revealing the answer. "
            f"Code:\n{code_text}\n"
            "Do not reveal the final output."
        )
    elif mode == "why_wrong":
        prompt = (
            "You are a coding tutor. The student answered incorrectly for this snippet. "
            f"Code:\n{code_text}\nExpected output:\n{expected_output}\nStudent answer:\n{user_answer or '<no answer>'}\n"
            "Explain why the student answer is incorrect and what detail they missed. Keep it short and supportive."
        )
    else:
        prompt = (
            "You are a coding tutor. Explain this code snippet line by line in a beginner-friendly way. "
            f"Code:\n{code_text}\nExpected output:\n{expected_output}\n"
            "Return a clear explanation of each step and how it contributes to the final output."
        )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=400,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception:
        return "The AI tutor is unavailable right now. Please try again later."
