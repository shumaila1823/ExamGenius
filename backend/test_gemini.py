
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("API key not found. Check your .env file.")
else:
    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents="Say: Hello ExamGenius! Gemini is connected successfully."
        )

        print("SUCCESS! Gemini is connected.")
        print(response.text)

    except Exception as error:
        print("Gemini connection failed:")
        print(error)
