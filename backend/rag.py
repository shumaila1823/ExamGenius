
def split_text(text, chunk_size=1000, overlap=200):
    """
    Split extracted PDF text into smaller overlapping chunks.
    """
    if not text or not text.strip():
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks

import chromadb
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Create a persistent ChromaDB database
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "chroma_db")

chroma_client = chromadb.PersistentClient(
    path=CHROMA_DB_PATH
)

collection = chroma_client.get_or_create_collection(
    name="exam_notes"
)


def generate_embedding(text):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )

    return response.embeddings[0].values


def store_chunks(chunks, filename):
    for index, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)

        collection.upsert(
            ids=[f"{filename}_{index}"],
            documents=[chunk],
            embeddings=[embedding],
            metadatas=[{
                "filename": filename,
                "chunk_index": index
            }]
        )

    return len(chunks)


def search_notes(question, top_k=3):
    query_embedding = generate_embedding(question)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    return results

