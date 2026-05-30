import os
import sys
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_groq import ChatGroq
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

DATA_DIR   = os.path.join(os.path.dirname(__file__), "data")
INDEX_PATH = os.path.join(os.path.dirname(__file__), "qdrant_index")
COLLECTION = "gym_recommender"


def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )


def build_index():
    print("Loading gym PDFs...")
    all_docs = []

    pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print("No PDFs found — using default knowledge only")
        return None

    for filename in pdf_files:
        path = os.path.join(DATA_DIR, filename)
        loader = PyMuPDFLoader(path)
        docs = loader.load()
        all_docs.extend(docs)
        print(f"  Loaded: {filename}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=50
    )
    chunks = splitter.split_documents(all_docs)
    print(f"Total chunks: {len(chunks)}")

    embeddings = get_embeddings()
    client = QdrantClient(path=INDEX_PATH)
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION,
        embedding=embeddings
    )
    vector_store.add_documents(chunks)
    print("Gym recommender index built!")
    return vector_store


def get_recommender_chain():
    if not os.path.exists(INDEX_PATH):
        build_index()

    embeddings = get_embeddings()
    client = QdrantClient(path=INDEX_PATH)
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION,
        embedding=embeddings
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 4})

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.4
    )

    prompt = PromptTemplate.from_template("""
You are an expert fitness consultant and gym advisor.
Use the following fitness program information to make recommendations.

Context from fitness programs:
{context}

User request: {question}

Provide specific, actionable recommendations. Include:
1. Recommended workout program or gym type
2. Why it suits their goals
3. Key exercises to focus on
4. Estimated timeline for results

Answer:""")

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain