import os
import json

import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY


def generate_ai_snippet(difficulty: str) -> dict | None:
    if not OPENAI_API_KEY:
        return None

    prompt = (
        f"Generate one Python code snippet for a {difficulty} difficulty programming exercise. "
        "Return the result as a JSON object with keys: code_text, expected_output, explanation. "
        "The code_text should be a short Python snippet. The expected_output should be the exact console output only. "
        "The explanation should describe how the code executes in a couple of sentences. "
        "Do not include any additional text outside the JSON object."
    )

    response = openai.ChatCompletion.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.8,
    )

    content = response.choices[0].message.content.strip()
    try:
        # If output is a valid JSON string, parse it directly.
        return json.loads(content)
    except json.JSONDecodeError:
        # Attempt to extract JSON block from the response.
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(content[start:end+1])
            except json.JSONDecodeError:
                return None
    return None
