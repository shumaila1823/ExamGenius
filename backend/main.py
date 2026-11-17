
import time

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from pydantic import BaseModel
from io import BytesIO

from rag import split_text, store_chunks, search_notes, client

app = FastAPI(
    title="ExamGenius API",
    description="AI-powered Exam Preparation Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {
        "message": "Welcome to ExamGenius!",
        "status": "Backend is running successfully"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    try:
        content = await file.read()
        reader = PdfReader(BytesIO(content))

        extracted_text = ""

        for page in reader.pages:
            extracted_text += page.extract_text() or ""

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF."
            )

        chunks = split_text(extracted_text)
        stored_count = store_chunks(chunks, file.filename)

        return {
            "filename": file.filename,
            "total_pages": len(reader.pages),
            "total_chunks": len(chunks),
            "stored_chunks": stored_count,
            "extracted_text": extracted_text,
            "message": "PDF uploaded and stored successfully!"
        }

    except HTTPException:
        raise

    except Exception as error:
        print("PDF processing error:", error)

        raise HTTPException(
            status_code=500,
            detail="PDF processing failed. Check backend terminal."
        )


@app.post("/ask-ai")
def ask_ai(request: QuestionRequest):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    try:
        # Search uploaded notes
        results = search_notes(request.question, top_k=4)

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        if not documents:
            return {
                "answer": "No relevant notes found. Please upload study material first.",
                "sources": []
            }

        context = "\n\n".join(documents)

        prompt = f"""
You are ExamGenius, an educational AI tutor.

Answer the student's question using ONLY the information
provided in the study notes below.

If the answer is not available in the notes, clearly say
that the uploaded material does not contain enough information.

Explain answers in simple, student-friendly language.

STUDY NOTES:
{context}

STUDENT QUESTION:
{request.question}

ANSWER:
"""

        # Retry temporary Gemini 503 errors
        response = None

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=prompt
                )
                break

            except Exception as error:
                error_message = str(error)

                if "503" in error_message or "UNAVAILABLE" in error_message:

                    if attempt == 2:
                        raise HTTPException(
                            status_code=503,
                            detail="Gemini is temporarily busy. Please try again in a few minutes."
                        )

                    time.sleep(2 ** (attempt + 1))

                else:
                    raise

        if response is None or not response.text:
            raise HTTPException(
                status_code=503,
                detail="Gemini did not return an answer. Please try again."
            )

        # Identify source documents
        sources = list({
            item.get("filename", "Unknown file")
            for item in metadatas
        })

        return {
            "question": request.question,
            "answer": response.text,
            "sources": sources
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Ask AI error:", error)

        raise HTTPException(
            status_code=500,
            detail="AI answer generation failed. Check backend terminal."
        )

