from .database import SessionLocal, engine
from . import models

models.Base.metadata.create_all(bind=engine)

snippets = [
    {
        "difficulty_level": "Beginner",
        "code_text": "for i in range(3):\n    print(i)",
        "expected_output": "0\n1\n2",
        "explanation": "The loop prints numbers 0, 1, and 2 on separate lines.",
    },
    {
        "difficulty_level": "Intermediate",
        "code_text": "numbers = [1, 2, 3]\nprint(sum(numbers) * len(numbers))",
        "expected_output": "18",
        "explanation": "The sum is 6, and length is 3, so the result is 6 * 3 = 18.",
    },
    {
        "difficulty_level": "Advanced",
        "code_text": "def fib(n):\n    if n < 2:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint(fib(5))",
        "expected_output": "5",
        "explanation": "The recursive Fibonacci function returns the 5th value in the sequence, which is 5.",
    },
]


def run():
    db = SessionLocal()
    try:
        for snippet_data in snippets:
            existing = db.query(models.Snippet).filter(models.Snippet.code_text == snippet_data["code_text"]).first()
            if not existing:
                snippet = models.Snippet(**snippet_data)
                db.add(snippet)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
