
from rag import generate_embedding

test_text = "Machine learning helps computers learn from data."

embedding = generate_embedding(test_text)

print("SUCCESS! Embedding generated.")
print("Embedding dimensions:", len(embedding))
