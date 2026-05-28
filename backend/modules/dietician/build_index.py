import sys
import os

# Load .env from backend folder
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

# Point to backend/.env explicitly
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

# Debug — confirm key is loaded
key = os.getenv("GOOGLE_API_KEY")
print("API Key loaded:", "YES" if key else "NO — CHECK YOUR .env FILE")

from rag_pipeline import build_vector_store

if __name__ == "__main__":
    print("Building FAISS index from your PDFs...")
    store = build_vector_store()
    if store:
        print("\nDone! Your index is ready.")
    else:
        print("\nFailed. Make sure your PDFs are in the data/ folder.")