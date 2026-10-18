"""
ANTARA MCQ Generation Service
Extracts text from an uploaded document and asks an LLM to generate
grounded MCQs (questions built ONLY from the source text).

Run: uvicorn main:app --reload --port 8000
Requires a GROQ_API_KEY environment variable.
"""

import os
import json
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from openai import OpenAI  # Groq speaks the OpenAI-compatible API

app = FastAPI(title="ANTARA MCQ Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before production
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


def extract_text(file: UploadFile) -> str:
    if file.filename.lower().endswith(".pdf"):
        reader = PdfReader(file.file)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    # Fallback: treat as plain text (.txt, .md)
    return file.file.read().decode("utf-8", errors="ignore")


def chunk_text(text: str, max_chars: int = 6000):
    """Simple chunker so long documents don't blow past context limits."""
    chunks = []
    while text:
        chunks.append(text[:max_chars])
        text = text[max_chars:]
    return chunks


PROMPT_TEMPLATE = """You are generating a quiz for a government official's capacity-building assessment.

Using ONLY the text below, generate {n} multiple-choice questions. Do not use any
outside knowledge — every question and its correct answer must be verifiable from
this text alone. Each question needs 4 options, one correct answer, and a one-sentence
explanation citing the source text.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_index": 0,
      "explanation": "..."
    }}
  ]
}}

SOURCE TEXT:
{text}
"""


@app.post("/generate-quiz")
async def generate_quiz(file: UploadFile = File(...), num_questions: int = 5):
    text = extract_text(file)
    if not text.strip():
        raise HTTPException(400, "Could not extract any text from this file.")

    chunk = chunk_text(text)[0]  # MVP: use the first chunk; loop over chunks for full-doc coverage later

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": PROMPT_TEMPLATE.format(n=num_questions, text=chunk),
            }],
        )
        raw = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(500, f"Groq API call failed: {type(e).__name__}: {str(e)}")

    if not raw:
        raise HTTPException(500, "Groq returned an empty response.")

    raw = re.sub(r"^```json|```$", "", raw.strip(), flags=re.MULTILINE).strip()

    try:
        quiz = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(500, f"Model did not return valid JSON: {raw[:200]}")

    return quiz


@app.get("/health")
def health():
    return {"status": "ok"}
